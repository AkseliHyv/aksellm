using backend.Exceptions;
using backend.Helpers;
using backend.Models.Common;
using backend.Models.Domain;
using backend.Models.DTOs.LLM;

namespace backend.Services
{
    public interface ILLMService
    {
        Task<LLMResponseDto> GetAllLLMsAsync(string token, string refreshToken);
        Task<LLMResponseDto> GetLLMByIdAsync(int id, string token, string refreshToken);
        Task<LLMResponseDto> CreateLLMAsync(CreateLLMDto createLLMDto, string token, string refreshToken);
        Task<LLMResponseDto> UpdateLLMAsync(int id, UpdateLLMDto updateLLMDto, string token, string refreshToken);
        Task DeleteLLMAsync(int id, string token, string refreshToken);
        Task<GetMessagesDto> GetLLMMessagesAsync(int id, string token, string refreshToken);
        Task<MessageResponseDto> SendMessageAsync(int id, string message, string token, string refreshToken);
    }

    public class LLMService : ILLMService
    {
        public async Task<LLMResponseDto> GetAllLLMsAsync(string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            await supabase.Auth.SetSession(token, refreshToken);

            var user = supabase.Auth.CurrentUser;
            if (user == null)
                throw new UnauthorizedAccessException("Invalid or expired session");

            var result = await supabase.From<LLMEntity>()
                .Where(x => x.UserId == user.Id)
                .Limit(15)
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

        public async Task<LLMResponseDto> GetLLMByIdAsync(int id, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            await supabase.Auth.SetSession(token, refreshToken);

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

            return response;
        }

        public async Task<LLMResponseDto> CreateLLMAsync(CreateLLMDto createLLMDto, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            await supabase.Auth.SetSession(token, refreshToken);

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

            return response;
        }

        public async Task<LLMResponseDto> UpdateLLMAsync(int id, UpdateLLMDto updateLLMDto, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            await supabase.Auth.SetSession(token, refreshToken);

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

            return response;
        }

        public async Task DeleteLLMAsync(int id, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            await supabase.Auth.SetSession(token, refreshToken);

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

            await supabase.From<MessageEntity>()
                .Where(x => x.LLMId == id)
                .Delete();

            await supabase.From<LLMEntity>()
                .Where(x => x.Id == id)
                .Delete();
        }

        public async Task<GetMessagesDto> GetLLMMessagesAsync(int id, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            await supabase.Auth.SetSession(token, refreshToken);

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

            return new GetMessagesDto
            {
                ChatMessages = messages.Models.Select(msg => new Message
                {
                    Id = msg.Id,
                    Role = msg.Role!,
                    Content = msg.Content!,
                    CreatedAt = msg.CreatedAt
                }).Reverse().ToList()
            };
        }

        public async Task<MessageResponseDto> SendMessageAsync(int id, string message, string token, string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(message))
                throw new ValidationException("No message given");

            var supabase = await SupabaseHelper.GetClientAsync();
            await supabase.Auth.SetSession(token, refreshToken);

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

            try
            {
                var userMessageEntity = new MessageEntity
                {
                    Role = "user",
                    Content = message,
                    LLMId = id,
                    CreatedAt = DateTime.UtcNow,
                };

                var userMessage = await supabase
                    .From<MessageEntity>()
                    .Insert(userMessageEntity);

                if (userMessage.Model == null)
                    throw new Exception("Failed to send message");

                var historyResult = await supabase.From<MessageEntity>()
                    .Where(msg => msg.LLMId == id)
                    .Order("id", Supabase.Postgrest.Constants.Ordering.Descending)
                    .Limit(10)
                    .Get();

                var chatHistory = historyResult.Models
                    .OrderBy(msg => msg.Id)
                    .ToList();

                // Send chat history & config to model
                // Wait for response
                string llmResponse = "This is a placeholder response";

                var assistantMessageEntity = new MessageEntity
                {
                    Role = "assistant",
                    Content = llmResponse,
                    LLMId = id,
                    CreatedAt = DateTime.UtcNow,
                };

                var assistantMessage = await supabase
                    .From<MessageEntity>()
                    .Insert(assistantMessageEntity);

                if (assistantMessage.Model == null)
                    throw new Exception("Unexpected error happened while responding");

                var response = new MessageResponseDto
                {
                    UserMessage = new Message
                    {
                        Id = userMessage.Model.Id,
                        Role = userMessage.Model.Role,
                        Content = userMessage.Model.Content,
                        CreatedAt = userMessage.Model.CreatedAt
                    },

                    AssistantMessage = new Message
                    {
                        Id = assistantMessage.Model.Id,
                        Role = assistantMessage.Model.Role,
                        Content = assistantMessage.Model.Content,
                        CreatedAt = assistantMessage.Model.CreatedAt
                    }
                };

                return response;
            }
            finally
            {
                await supabase.Rpc("release_llm_generation", new { target_llm = id });
            }
        }
    }
}