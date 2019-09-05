﻿using HADotNet.CommandCenter.Hubs;  
using HADotNet.CommandCenter.Middleware;
using HADotNet.CommandCenter.Models;
using HADotNet.CommandCenter.Services;
using HADotNet.CommandCenter.Services.Interfaces;
using HADotNet.Core;
using HADotNet.Core.Clients;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Runtime.InteropServices;

namespace HADotNet.CommandCenter
{
    public class Startup
    {
        public IConfiguration Configuration { get; }
        public IWebHostEnvironment Environment { get; }

        public Startup(IConfiguration configuration, IWebHostEnvironment env)
        {
            Configuration = configuration;
            Environment = env;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddLogging(l =>
            {
                l.ClearProviders();
                l.AddConsole();

                if (Environment.IsDevelopment())
                {
                    l.AddDebug();
                    l.SetMinimumLevel(LogLevel.Debug);
                    l.AddFilter("Microsoft", LogLevel.Information);
                    l.AddFilter("System", LogLevel.Information);
                }
                else
                {
                    l.SetMinimumLevel(LogLevel.Information);
                    l.AddFilter("Microsoft", LogLevel.Error);
                    l.AddFilter("System", LogLevel.Warning);
                }
            });
            services.AddOptions();

            services.Configure<HaccOptions>(Configuration.GetSection("HACC"));

            // For Linux/Docker - Persist keys to /var storage - ASP Core complains otherwise.
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                services.AddDataProtection()
                        .SetApplicationName("HACC")
                        .PersistKeysToFileSystem(new DirectoryInfo(@"/var/hacc-keys/"));
            }

            services.AddSingleton<IConfigStore, JsonConfigStore>();
            services.AddScoped(_ => ClientFactory.GetClient<EntityClient>());
            services.AddScoped(_ => ClientFactory.GetClient<StatesClient>());
            services.AddScoped(_ => ClientFactory.GetClient<ServiceClient>());
            services.AddScoped(_ => ClientFactory.GetClient<DiscoveryClient>());

            services.AddSignalR()
                    .AddNewtonsoftJsonProtocol();

            services.AddControllersWithViews();

            services.AddMvc()
                    .AddNewtonsoftJson();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseStaticFiles();

            app.UseHAClientInitialization();

            app.UseRouting();

            app.UseEndpoints(ep =>
            {
                ep.MapHub<TileHub>("/hubs/tile");
                ep.MapDefaultControllerRoute();
            });
        }
    }
}
