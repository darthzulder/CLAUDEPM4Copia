import { provideZoneChangeDetection } from "@angular/core";
// src/main.server.ts
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/ssr';
import { App } from './app/app';
import { config } from './app/app.config.server'; 

export default function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(
    App,
    {
      ...config,
      providers: [
        provideZoneChangeDetection(),provideServerRendering(),
        ...(config?.providers ?? []),
      ],
    },
    context, 
  );
}