import { get, set } from 'idb-keyval';
import QRCode from 'qrcode';

export async function getOrGenerateQRCodeImage(id: string, redirectUrl: string): Promise<string> {
  const dbKey = `qr_img_${id}`;
  try {
    const cachedImage = await get<string>(dbKey);
    if (cachedImage) {
      return cachedImage;
    }
  } catch (err) {
    console.warn('Erro ao ler IndexedDB, gerando imagem novamente:', err);
  }

  // Gera a imagem em base64 DataURL
  const dataUrl = await QRCode.toDataURL(redirectUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  try {
    await set(dbKey, dataUrl);
  } catch (err) {
    console.warn('Erro ao salvar no IndexedDB:', err);
  }

  return dataUrl;
}
