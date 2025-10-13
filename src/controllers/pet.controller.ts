import { Request, Response } from 'express';
import { PetService } from '../services/pet.service';
import { PetImageService } from '../services/pet-image.service';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';

export class PetController {
  private petService: PetService;
  private petImageService: PetImageService;

  constructor() {
    this.petService = new PetService();
    this.petImageService = new PetImageService();
  }

  getAllPets = asyncHandler(async (req: Request, res: Response) => {
    const pets = await this.petService.findAll(req.query);
    sendSuccess(res, pets, 200);
  });

  getPet = asyncHandler(async (req: Request, res: Response) => {
    const pet = await this.petService.findOne(req.params.id);
    if (!pet) {
      sendError(res, new AppError(404, 'fail', 'Pet not found'));
      return;
    }
    sendSuccess(res, pet, 200);
  });

  createPet = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const petData = {
      ...req.body,
      images: files?.map(file => file.path) || []
    };
    
    const pet = await this.petService.create(petData);
    
    // Create image records if files were uploaded
    if (files?.length) {
      for (const file of files) {
        await this.petImageService.create({
          pet_id: pet.id,
          image_url: file.path
        });
      }
    }
    
    // Fetch the pet with its images
    const petWithImages = await this.petService.findOne(pet.id);
    sendSuccess(res, petWithImages, 201);
  });

  updatePet = asyncHandler(async (req: Request, res: Response) => {
    const pet = await this.petService.update(req.params.id, req.body);
    sendSuccess(res, pet, 200);
  });

  deletePet = asyncHandler(async (req: Request, res: Response) => {
    // First delete all pet images
    const images = await this.petImageService.findByPetId(req.params.id);
    if (images && Array.isArray(images)) {
      for (const image of images) {
        await this.petImageService.delete(image.id);
      }
    }
    
    await this.petService.delete(req.params.id);
    sendSuccess(res, { message: 'Pet deleted successfully' }, 200);
  });

  // // Image handling
  // uploadPetImage = asyncHandler(async (req: Request, res: Response) => {
  //   if (!req.file) {
  //     sendError(res, new AppError(404, 'error', 'No file uploaded'));
  //     return;
  //   }

  //   const image = await this.petImageService.create({
  //     pet_id: req.params.id,
  //     image_url: (req.file as Express.Multer.File & { path: string }).path,
  //   });

  //   sendSuccess(res, image, 201);
  // });

  // Multiple images handling
  uploadPetImages = asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      sendError(res, new AppError(404, 'error', 'No files uploaded'));
      return;
    }

    const files = req.files as Express.Multer.File[];
    const images = [];

    for (const file of files) {
      const image = await this.petImageService.create({
        pet_id: req.params.id,
        image_url: (file as Express.Multer.File & { path: string }).path,
      });
      images.push(image);
    }

    sendSuccess(res, images, 201);
  });

  deletePetImage = asyncHandler(async (req: Request, res: Response) => {
    await this.petImageService.delete(req.params.imageId);
    sendSuccess(res, { message: 'Image deleted successfully' }, 200);
  });

  getPetImages = asyncHandler(async (req: Request, res: Response) => {
    const images = await this.petImageService.findByPetId(req.params.id);
    sendSuccess(res, images, 200);
  });
}