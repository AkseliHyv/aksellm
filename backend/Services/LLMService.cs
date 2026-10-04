using backend.Exceptions;
using backend.Helpers;
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
        Task<(LLMResponseDto result, string? newToken, string? newRefreshToken)> GetAllLLMsAsync(string token, string refreshToken);
        Task<(LLMResponseDto result, string? newToken, string? newRefreshToken)> GetLLMByIdAsync(int id, string token, string refreshToken);
        Task<(LLMResponseDto result, string? newToken, string? newRefreshToken)> CreateLLMAsync(CreateLLMDto createLLMDto, string token, string refreshToken);
        Task<(LLMResponseDto result, string? newToken, string? newRefreshToken)> UpdateLLMAsync(int id, UpdateLLMDto updateLLMDto, string token, string refreshToken);
        Task<(string? newToken, string? newRefreshToken)> DeleteLLMAsync(int id, string token, string refreshToken);
        Task<(GetMessagesDto result, string? newToken, string? newRefreshToken)> GetLLMMessagesAsync(int id, string token, string refreshToken);
        Task<(MessageResponseDto result, string? newToken, string? newRefreshToken)> SendMessageAsync(int id, string message, string token, string refreshToken);
        IAsyncEnumerable<StreamEventDto> StreamMessageAsync(int id, string message, string token, string refreshToken, CancellationToken cancellationToken);
    }

    public class LLMService(HttpClient httpClient) : ILLMService
    {
        private static readonly JsonSerializerOptions OllamaJsonOptions = new()
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public async Task<(LLMResponseDto result, string? newToken, string? newRefreshToken)> GetAllLLMsAsync(string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            var session = await supabase.Auth.SetSession(token, refreshToken);

            var user = supabase.Auth.CurrentUser;
            if (user == null)
                throw new UnauthorizedAccessException("Invalid or expired session");

            var result = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == user.Id)
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

            var (newToken, newRefreshToken) = SupabaseHelper.GetRefreshedTokens(session, token, refreshToken);
            return (response, newToken, newRefreshToken);
        }

        public async Task<(LLMResponseDto result, string? newToken, string? newRefreshToken)> GetLLMByIdAsync(int id, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            var session = await supabase.Auth.SetSession(token, refreshToken);

            var user = supabase.Auth.CurrentUser;
            if (user == null)
                throw new UnauthorizedAccessException("Invalid or expired session");

            var result = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == user.Id && x.Id == id)
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

            var (newToken, newRefreshToken) = SupabaseHelper.GetRefreshedTokens(session, token, refreshToken);
            return (response, newToken, newRefreshToken);
        }

        public async Task<(LLMResponseDto result, string? newToken, string? newRefreshToken)> CreateLLMAsync(CreateLLMDto createLLMDto, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            var session = await supabase.Auth.SetSession(token, refreshToken);

            var user = supabase.Auth.CurrentUser;
            if (user == null || user.Id == null)
                throw new UnauthorizedAccessException("Invalid or expired session");

            var newLLM = new LLMEntity
            {
                UserId = user.Id,
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

            var (newToken, newRefreshToken) = SupabaseHelper.GetRefreshedTokens(session, token, refreshToken);
            return (response, newToken, newRefreshToken);
        }

        public async Task<(LLMResponseDto result, string? newToken, string? newRefreshToken)> UpdateLLMAsync(int id, UpdateLLMDto updateLLMDto, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            var session = await supabase.Auth.SetSession(token, refreshToken);

            var user = supabase.Auth.CurrentUser;
            if (user == null)
                throw new UnauthorizedAccessException("Invalid or expired session");

            var exists = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == user.Id)
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

            var (newToken, newRefreshToken) = SupabaseHelper.GetRefreshedTokens(session, token, refreshToken);
            return (response, newToken, newRefreshToken);
        }

        public async Task<(string? newToken, string? newRefreshToken)> DeleteLLMAsync(int id, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            var session = await supabase.Auth.SetSession(token, refreshToken);

            var user = supabase.Auth.CurrentUser;
            if (user == null)
                throw new UnauthorizedAccessException("Invalid or expired session");

            var exists = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == user.Id)
                .Where(x => x.Id == id)
                .Get();

            var llmEntity = exists.Models.FirstOrDefault();

            if (llmEntity == null)
                throw new NotFoundException("LLM not found");

            await supabase.From<LLMEntity>()
                .Where(x => x.Id == id)
                .Delete();

            return SupabaseHelper.GetRefreshedTokens(session, token, refreshToken);
        }

        public async Task<(GetMessagesDto result, string? newToken, string? newRefreshToken)> GetLLMMessagesAsync(int id, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            var session = await supabase.Auth.SetSession(token, refreshToken);

            var user = supabase.Auth.CurrentUser;
            if (user == null)
                throw new UnauthorizedAccessException("Invalid or expired session");

            var exists = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == user.Id && x.Id == id)
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

            var (newToken, newRefreshToken) = SupabaseHelper.GetRefreshedTokens(session, token, refreshToken);
            return (response, newToken, newRefreshToken);
        }

        public async Task<(MessageResponseDto result, string? newToken, string? newRefreshToken)> SendMessageAsync(int id, string message, string token, string refreshToken)
        {
            var (supabase, session, llm) = await ClaimGenerationAsync(id, message, token, refreshToken);

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

                var (newToken, newRefreshToken) = SupabaseHelper.GetRefreshedTokens(session, token, refreshToken);
                return (response, newToken, newRefreshToken);
            }
            finally
            {
                await supabase.Rpc("release_llm_generation", new { target_llm = id });
            }
        }

        public async IAsyncEnumerable<StreamEventDto> StreamMessageAsync(int id, string message, string token, string refreshToken, [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            var (supabase, session, llm) = await ClaimGenerationAsync(id, message, token, refreshToken);

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

                var (newToken, newRefreshToken) = SupabaseHelper.GetRefreshedTokens(session, token, refreshToken);
                yield return new StreamEventDto { Type = "session", NewToken = newToken, NewRefreshToken = newRefreshToken };

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

        private static async Task<(Supabase.Client supabase, Supabase.Gotrue.Session session, LLMEntity llm)> ClaimGenerationAsync(int id, string message, string token, string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(message))
                throw new ValidationException("No message given");

            var supabase = await SupabaseHelper.GetClientAsync();
            var session = await supabase.Auth.SetSession(token, refreshToken);

            var user = supabase.Auth.CurrentUser;
            if (user == null || user.Id == null)
                throw new UnauthorizedAccessException("Invalid or expired session");

            var exists = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == user.Id && x.Id == id)
                .Get();

            var llm = exists.Models.FirstOrDefault();
            if (llm == null)
                throw new NotFoundException("LLM not found");

            var claimed = await supabase.Rpc<bool>("claim_llm_generation", new { target_llm = id });
            if (!claimed)
                throw new ConflictException("This LLM is already generating a response, please wait or try again later");

            return (supabase, session, llm);
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
