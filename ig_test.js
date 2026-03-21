async function test() {
  try {
    const res = await fetch('https://www.instagram.com/chicobar_bcn/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
    });
    const text = await res.text();
    console.log('Status:', res.status);
    const titleMatch = text.match(/<meta property="og:title" content="([^"]+)"/);
    const imgMatch = text.match(/<meta property="og:image" content="([^"]+)"/);
    console.log('Title:', titleMatch ? titleMatch[1] : 'not found');
    console.log('Image:', imgMatch ? imgMatch[1] : 'not found');
  } catch (e) {
    console.error(e);
  }
}
test();
