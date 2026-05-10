import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads/properties');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// Asegurar que los directorios existen
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

export interface UploadedImage {
  url: string;
  publicId: string;
  thumbnailUrl: string;
}

export class ImageService {
  static async uploadImage(
    fileBuffer: Buffer,
    originalName: string,
    isMain: boolean = false
  ): Promise<UploadedImage> {
    try {
      const uniqueId = uuidv4();
      const timestamp = Date.now();
      const filename = `${uniqueId}-${timestamp}.jpg`;
      const thumbnailFilename = `thumb-${uniqueId}-${timestamp}.jpg`;
      
      const imagePath = path.join(UPLOADS_DIR, filename);
      const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);
      
      // Procesar imagen original (1200x800)
      await sharp(fileBuffer)
        .resize(1200, 800, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toFile(imagePath);
      
      // Generar thumbnail (400x267)
      await sharp(fileBuffer)
        .resize(400, 267, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);
      
      // URLs para acceder desde el navegador
      const url = `/uploads/properties/${filename}`;
      const thumbnailUrl = `/uploads/properties/thumbnails/${thumbnailFilename}`;
      
      console.log(`📸 Imagen guardada: ${filename}`);
      console.log(`   Original: ${imagePath}`);
      console.log(`   Thumbnail: ${thumbnailPath}`);
      
      return {
        url,
        thumbnailUrl,
        publicId: uniqueId
      };
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      throw new Error('Error al procesar la imagen');
    }
  }
  
  static async deleteImage(publicId: string): Promise<void> {
    try {
      // Buscar y eliminar archivos relacionados
      const files = fs.readdirSync(UPLOADS_DIR);
      const thumbnailFiles = fs.readdirSync(THUMBNAILS_DIR);
      
      const imageFile = files.find(f => f.startsWith(publicId));
      const thumbnailFile = thumbnailFiles.find(f => f.includes(publicId));
      
      if (imageFile) {
        fs.unlinkSync(path.join(UPLOADS_DIR, imageFile));
        console.log(`🗑️ Imagen eliminada: ${imageFile}`);
      }
      
      if (thumbnailFile) {
        fs.unlinkSync(path.join(THUMBNAILS_DIR, thumbnailFile));
        console.log(`🗑️ Thumbnail eliminado: ${thumbnailFile}`);
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
    }
  }
  
  static async deleteManyImages(publicIds: string[]): Promise<void> {
    for (const publicId of publicIds) {
      await this.deleteImage(publicId);
    }
  }
}