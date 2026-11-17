using backend.Exceptions;
using backend.Models.Common;
using backend.Models.Domain;
using backend.Models.DTOs.LLM;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace backend.Services
{
    public interface ILLMService
    {
        Task<LLMResponseDto> GetAllLLMsAsync();
        Task<LLMResponseDto> GetLLMByIdAsync(int id);
        Task<LLMResponseDto> CreateLLMAsync(CreateLLMDto createLLMDto);
        Task<LLMResponseDto> UpdateLLMAsync(int id, UpdateLLMDto updateLLMDto);
        Task DeleteLLMAsync(int id);
        Task<GetMessagesDto> GetLLMMessagesAsync(int id);
        Task<MessageResponseDto> SendMessageAsync(int id, string message);
        IAsyncEnumerable<StreamEventDto> StreamMessageAsync(int id, string message, CancellationToken cancellationToken);
    }

    public class LLMService(HttpClient httpClient, ISupabaseUserClient userClient) : ILLMService
    {
        private static readonly JsonSerializerOptions OllamaJsonOptions = new()
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public async Task<LLMResponseDto> GetAllLLMsAsync()
        {
            var supabase = await userClient.GetClientAsync();
            var userId = userClient.UserId;

            var result = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == userId)
                .Get();

            var response = new LLMResponseDto
            {
                LLMs = result.Models.Select(llm => new LLMModel
                {
                    Id = llm!.Id!,
                    Name = llm.Name!,
                    Config = llm.LLMConfig!,
                    CreatedAt = llm.CreatedAt
                })
            };

            return response;
        }

        public async Task<LLMResponseDto> GetLLMByIdAsync(int id)
        {
            var supabase = await userClient.GetClientAsync();
            var userId = userClient.UserId;

            var result = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == userId && x.Id == id)
                .Get();

            var llm = result.Models.FirstOrDefault();

            if (llm == null) throw new NotFoundException("LLM not found");

            var response = new LLMResponseDto
            {
                LLMs = new List<LLMModel>
                {
                    new LLMModel
                    {
                        Id = llm.Id!,
                        Name = llm.Name!,
                        Config = llm.LLMConfig!,
                        CreatedAt = llm.CreatedAt
                    }
                }
            };

            return response;
        }

        public async Task<LLMResponseDto> CreateLLMAsync(CreateLLMDto createLLMDto)
        {
            var supabase = await userClient.GetClientAsync();
            var userId = userClient.UserId;

            var newLLM = new LLMEntity
            {
                UserId = userId,
                Name = createLLMDto.Name,
                LLMConfig = createLLMDto.Config,
                CreatedAt = DateTime.UtcNow
            };

            var result = await supabase.From<LLMEntity>().Insert(newLLM);
            var llm = result.Models.FirstOrDefault();

            if (llm == null)
                throw new Exception("Failed to create LLM");

            var response = new LLMResponseDto
            {
                LLMs = new List<LLMModel>
                {
                    new LLMModel
                    {
                        Id = llm.Id!,
                        Name = llm.Name!,
                        Config = llm.LLMConfig!,
                        CreatedAt = llm.CreatedAt
                    }
                }
            };

            return response;
        }

        public async Task<LLMResponseDto> UpdateLLMAsync(int id, UpdateLLMDto updateLLMDto)
        {
            var supabase = await userClient.GetClientAsync();
            var userId = userClient.UserId;

            var exists = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == userId)
                .Where(x => x.Id == id)
                .Get();

            var llmEntity = exists.Models.FirstOrDefault();

            if (llmEntity == null)
                throw new NotFoundException("LLM not found");

            if (updateLLMDto.Name != null)
                llmEntity.Name = updateLLMDto.Name;

            if (updateLLMDto.Config != null)
                llmEntity.LLMConfig = updateLLMDto.Config;

            var result = await supabase.From<LLMEntity>().Update(llmEntity);
            var llm = result.Models.FirstOrDefault();

            if (llm == null)
                throw new Exception("Failed to update LLM");

            var response = new LLMResponseDto
            {
                LLMs = new List<LLMModel>
                {
                    new LLMModel
                    {
                        Id = llm.Id!,
                        Name = llm.Name!,
                        Config = llm.LLMConfig!,
                        CreatedAt = llm.CreatedAt
                    }
                }
            };

            return response;
        }

        public async Task DeleteLLMAsync(int id)
        {
            var supabase = await userClient.GetClientAsync();
            var userId = userClient.UserId;

            var exists = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == userId)
                .Where(x => x.Id == id)
                .Get();

            var llmEntity = exists.Models.FirstOrDefault();

            if (llmEntity == null)
                throw new NotFoundException("LLM not found");

            await supabase.From<LLMEntity>()
                .Where(x => x.Id == id)
                .Delete();
        }

        public async Task<GetMessagesDto> GetLLMMessagesAsync(int id)
        {
            var supabase = await userClient.GetClientAsync();
            var userId = userClient.UserId;

            var exists = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == userId && x.Id == id)
                .Get();

            var llm = exists.Models.FirstOrDefault();
            if (llm == null)
                throw new NotFoundException("LLM not found");

            var messages = await supabase.From<MessageEntity>()
                .Where(msg => msg.LLMId == id)
                .Order("id", Supabase.Postgrest.Constants.Ordering.Descending)
                .Limit(50)
                .Get();

            var response = new GetMessagesDto
            {
                ChatMessages = messages.Models.Select(msg => new Message
                {
                    Id = msg.Id,
                    Role = msg.Role!,
                    Content = msg.Content!,
                    CreatedAt = msg.CreatedAt
                }).Reverse().ToList()
            };

            return response;
        }

        public async Task<MessageResponseDto> SendMessageAsync(int id, string message)
        {
            var (supabase, llm) = await ClaimGenerationAsync(id, message);

            try
            {
                var sentAt = DateTime.UtcNow;
                var chatRequest = await BuildChatRequestAsync(supabase, llm, message, false);

                var httpResponse = await httpClient.PostAsJsonAsync("/api/chat", chatRequest, OllamaJsonOptions);
                httpResponse.EnsureSuccessStatusCode();

                var json = await httpResponse.Content.ReadFromJsonAsync<JsonNode>();
                string llmResponse = json?["message"]?["content"]?.GetValue<string>()
                    ?? throw new Exception("Empty response from Ollama");

                var response = await SaveMessagesAsync(supabase, id, message, sentAt, llmResponse);

                return response;
            }
            finally
            {
                await supabase.Rpc("release_llm_generation", new { target_llm = id });
            }
        }

        public async IAsyncEnumerable<StreamEventDto> StreamMessageAsync(int id, string message, [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            var (supabase, llm) = await ClaimGenerationAsync(id, message);

            try
            {
                var sentAt = DateTime.UtcNow;
                var chatRequest = await BuildChatRequestAsync(supabase, llm, message, true);

                using var request = new HttpRequestMessage(HttpMethod.Post, "/api/chat")
                {
                    Content = JsonContent.Create(chatRequest, options: OllamaJsonOptions)
                };

                using var httpResponse = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                httpResponse.EnsureSuccessStatusCode();

                yield return new StreamEventDto { Type = "start" };

                await using var stream = await httpResponse.Content.ReadAsStreamAsync(cancellationToken);
                using var reader = new StreamReader(stream);
                var llmResponse = new StringBuilder();

                while (await reader.ReadLineAsync(cancellationToken) is { } line)
                {
                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    var chunk = JsonNode.Parse(line);

                    var error = chunk?["error"]?.GetValue<string>();
                    if (error != null)
                        throw new Exception($"Ollama stream failed: {error}");

                    var content = chunk?["message"]?["content"]?.GetValue<string>();
                    if (!string.IsNullOrEmpty(content))
                    {
                        llmResponse.Append(content);
                        yield return new StreamEventDto { Type = "chunk", Content = content };
                    }

                    if (chunk?["done"]?.GetValue<bool>() == true)
                        break;
                }

                if (llmResponse.Length == 0)
                    throw new Exception("Empty response from Ollama");

                var saved = await SaveMessagesAsync(supabase, id, message, sentAt, llmResponse.ToString());

                yield return new StreamEventDto
                {
                    Type = "done",
                    UserMessage = saved.UserMessage,
                    AssistantMessage = saved.AssistantMessage
                };
            }
            finally
            {
                await supabase.Rpc("release_llm_generation", new { target_llm = id });
            }
        }

        private async Task<(Supabase.Client supabase, LLMEntity llm)> ClaimGenerationAsync(int id, string message)
        {
            if (string.IsNullOrWhiteSpace(message))
                throw new ValidationException("No message given");

            var supabase = await userClient.GetClientAsync();
            var userId = userClient.UserId;

            var exists = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == userId && x.Id == id)
                .Get();

            var llm = exists.Models.FirstOrDefault();
            if (llm == null)
                throw new NotFoundException("LLM not found");

            var claimed = await supabase.Rpc<bool>("claim_llm_generation", new { target_llm = id });
            if (!claimed)
                throw new ConflictException("This LLM is already generating a response, please wait or try again later");

            return (supabase, llm);
        }

        private static async Task<object> BuildChatRequestAsync(Supabase.Client supabase, LLMEntity llm, string message, bool stream)
        {
            var config = llm.LLMConfig ?? throw new Exception("LLM configuration is missing");

            var messageHistory = await supabase.From<MessageEntity>()
                .Where(msg => msg.LLMId == llm.Id)
                .Order("id", Supabase.Postgrest.Constants.Ordering.Descending)
                .Limit(9)
                .Get();

            var messages = messageHistory.Models
                .OrderBy(msg => msg.Id)
                .Select(msg => new { role = msg.Role, content = msg.Content })
                .ToList();

            messages.Add(new { role = "user", content = message });

            if (!string.IsNullOrWhiteSpace(config.SystemPrompt))
                messages.Insert(0, new { role = "system", content = config.SystemPrompt });

            return new
            {
                model = config.Model,
                messages,
                stream,
                options = new
                {
                    temperature = config.Temperature,
                    num_predict = config.MaxTokens,
                    top_p = config.TopP,
                    top_k = config.TopK,
                    repeat_penalty = config.RepeatPenalty,
                    seed = config.Seed
                }
            };
        }

        private static async Task<MessageResponseDto> SaveMessagesAsync(Supabase.Client supabase, int id, string message, DateTime sentAt, string llmResponse)
        {
            var inserted = await supabase.From<MessageEntity>().Insert(new List<MessageEntity>
            {
                new() { Role = "user", Content = message, LLMId = id, CreatedAt = sentAt },
                new() { Role = "assistant", Content = llmResponse, LLMId = id, CreatedAt = DateTime.UtcNow }
            });

            if (inserted.Models.Count != 2)
                throw new Exception("Failed to save messages");

            return new MessageResponseDto
            {
                UserMessage = ToMessage(inserted.Models[0]),
                AssistantMessage = ToMessage(inserted.Models[1])
            };
        }

        private static Message ToMessage(MessageEntity entity) => new()
        {
            Id = entity.Id,
            Role = entity.Role,
            Content = entity.Content,
            CreatedAt = entity.CreatedAt
        };
    }
}
