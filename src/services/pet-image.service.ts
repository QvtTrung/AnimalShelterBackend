import { BaseService } from './base.service';
import { deleteImage } from '../middleware/upload.middleware';

interface PetImage {
  id: string;
  pet_id: string;
  image_url: string;
  created_at?: Date;
  updated_at?: Date;
}

export class PetImageService extends BaseService<PetImage> {
  constructor() {
    super('pet_images');
  }

  async delete(id: string) {
    try {
      const image = await this.findOne(id);
      if (image?.image_url) {
        // Extract public_id from Cloudinary URL
        // Cloudinary URLs are in format: https://res.cloudinary.com/cloud_name/image/upload/v1234567/folder/public_id.jpg
        const urlParts = image.image_url.split('/');
        // Find the index of 'upload' in the URL
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          // The public ID includes the folder and is everything after 'upload/v{version}/'
          const publicId = urlParts.slice(uploadIndex + 2).join('/').split('.')[0];
          if (publicId) {
            await deleteImage(publicId);
          }
        }
      }
      return await super.delete(id);
    } catch (error) {
      console.error('Error deleting pet image:', error);
      throw error;
    }
  }

  async findByPetId(petId: string) {
    try {
      return await this.findAll({
        filter: { pet_id: { _eq: petId } },
      });
    } catch (error) {
      throw error;
    }
  }
}