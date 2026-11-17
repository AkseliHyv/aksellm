using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace backend.Helpers
{
    public class JwksRetriever : IConfigurationRetriever<OpenIdConnectConfiguration>
    {
        public async Task<OpenIdConnectConfiguration> GetConfigurationAsync(string address, IDocumentRetriever retriever, CancellationToken cancel)
        {
            var json = await retriever.GetDocumentAsync(address, cancel);
            var configuration = new OpenIdConnectConfiguration { JwksUri = address };

            foreach (var key in new JsonWebKeySet(json).GetSigningKeys())
                configuration.SigningKeys.Add(key);

            return configuration;
        }
    }
}
