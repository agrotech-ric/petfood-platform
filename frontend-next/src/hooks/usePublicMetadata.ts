import { useEffect } from 'react'

export function usePublicMetadata(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const created = !robots
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    const oldContent = robots.content
    robots.content = 'noindex,nofollow,noarchive'
    return () => {
      document.title = previous
      if (created) robots?.remove()
      else if (robots) robots.content = oldContent
    }
  }, [title])
}
