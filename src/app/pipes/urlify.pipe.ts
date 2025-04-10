import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'urlify',
  standalone: true
})
export class UrlifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string): SafeHtml {
    if (!text) return '';

    // Expresión regular para detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Reemplazar URLs con enlaces HTML
    const htmlText = text.replace(
      urlRegex,
      (url) => {
        // Crear una versión más corta y amigable de la URL para mostrar
        let displayUrl = url;
        try {
          const urlObj = new URL(url);
          // Mostrar solo el dominio y parte de la ruta si es muy larga
          displayUrl = urlObj.hostname;
          if (urlObj.pathname && urlObj.pathname !== '/') {
            // Añadir parte de la ruta si no es demasiado larga
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            if (pathParts.length > 0) {
              displayUrl += '/' + (pathParts.length > 1 ? '...' : pathParts[0]);
            }
          }
        } catch (e) {
          // Si hay un error al parsear la URL, usar la URL original
          console.error('Error parsing URL:', e);
        }

        return `<a href="${url}"
                  target="_blank"
                  class="task-link"
                  title="${url}"
                  onclick="event.stopPropagation()">🔗 ${displayUrl}</a>`;
      }
    );

    // Sanitizar el HTML para evitar problemas de seguridad
    return this.sanitizer.bypassSecurityTrustHtml(htmlText);
  }
}
