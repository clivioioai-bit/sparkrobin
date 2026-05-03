import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing-config'

export default createMiddleware(routing)

export const config = {
  matcher: [
    '/((?!api|_next|static|videos|images|favicon|icon|logo|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|avif|woff|woff2|ttf|eot|mp4|webm|mov|avi|mkv|webmanifest|xml|txt)$).*)',
  ],
}
