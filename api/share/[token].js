// Vercel Edge Function pour servir les métadonnées Open Graph aux bots
export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') || request.url.split('/').pop()
  
  // Extraire le token de l'URL si pas dans les params
  const urlParts = request.url.split('/')
  const tokenFromUrl = urlParts[urlParts.length - 1]
  const finalToken = token || tokenFromUrl
  
  const userAgent = request.headers.get('user-agent') || ''
  const isBot = /bot|crawler|spider|facebook|twitter|whatsapp|telegram|discord|facebookexternalhit|twitterbot|linkedinbot/i.test(userAgent)
  
  console.log('🔍 [Edge Function] Token:', finalToken)
  console.log('🔍 [Edge Function] User-Agent:', userAgent)
  console.log('🔍 [Edge Function] Is Bot:', isBot)
  
  if (!isBot) {
    // Utilisateur normal - rediriger vers l'app React
    return Response.redirect(`https://hifadhui.site/share/${finalToken}`, 302)
  }
  
  try {
    // Bot détecté - récupérer les métadonnées depuis l'API
    const metaResponse = await fetch(`https://hifadhui.site/api/v1/share/${finalToken}/meta`)
    
    if (!metaResponse.ok) {
      return new Response('<h1>Lien de partage invalide ou expiré</h1>', {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      })
    }
    
    const metadata = await metaResponse.json()
    
    console.log('🔍 [Edge Function] Métadonnées récupérées:', metadata)
    
    // Générer HTML avec métadonnées Open Graph
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <title>${metadata.title}</title>
    <meta name="description" content="${metadata.description}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${metadata.url}" />
    <meta property="og:title" content="${metadata.title}" />
    <meta property="og:description" content="${metadata.description}" />
    <meta property="og:image" content="${metadata.image}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta property="og:image:alt" content="Hifadhwi - Coffre-fort numérique" />
    <meta property="og:site_name" content="Hifadhwi" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary" />
    <meta property="twitter:url" content="${metadata.url}" />
    <meta property="twitter:title" content="${metadata.title}" />
    <meta property="twitter:description" content="${metadata.description}" />
    <meta property="twitter:image" content="${metadata.image}" />
    <meta property="twitter:image:alt" content="Hifadhwi - Coffre-fort numérique" />
    
    <meta http-equiv="refresh" content="2;url=${metadata.url}" />
</head>
<body>
    <h1>Fichier partagé : ${metadata.filename}</h1>
    <p>Partagé par ${metadata.owner}</p>
    <p>Redirection automatique dans 2 secondes...</p>
    <p><a href="${metadata.url}">Cliquez ici si vous n'êtes pas redirigé</a></p>
</body>
</html>`
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache 5 minutes
      }
    })
    
  } catch (error) {
    console.error('🔍 [Edge Function] Erreur:', error)
    return new Response('<h1>Erreur lors du chargement</h1>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
