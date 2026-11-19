
export default async function handler(req, res) {
  // Permite consultas pelo navegador
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Chave da API do YouTube não configurada na Vercel."
    });
  }

  const channelId = req.query.channelId;

  if (!channelId || !/^UC[\w-]{22}$/.test(channelId)) {
    return res.status(400).json({
      error: "Informe um ID de canal válido do YouTube."
    });
  }

  try {
    const url = new URL(
      "https://www.googleapis.com/youtube/v3/search"
    );

    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("eventType", "live");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Erro ao consultar o YouTube."
      });
    }

    const live = data.items?.[0];

    return res.status(200).json({
      channelId,
      isLive: Boolean(live),
      stream: live ? {
        videoId: live.id.videoId,
        title: live.snippet.title,
        channelTitle: live.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${live.id.videoId}`,
        thumbnail: live.snippet.thumbnails?.high?.url
      } : null
    });

  } catch (error) {
    return res.status(500).json({
      error: "Não foi possível consultar o YouTube."
    });
  }
}
