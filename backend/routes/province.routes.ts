import express from 'express';
import { ProvinceController } from '@controllers/province/province.controller';
import { asyncHandler } from '@utils/async-handler';

const router = express.Router();

// GET /api/v1/provinces - Public route to fetch Cambodia provinces
router.get('/', asyncHandler(ProvinceController.getAllProvincesController));

export default router;
