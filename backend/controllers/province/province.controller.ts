import { Request, Response } from 'express';
import { getCambodiaProvinces } from '@services/province/province.service';

export class ProvinceController {
  static async getAllProvincesController(_req: Request, res: Response) {
    const result = await getCambodiaProvinces();
    res.status(200).json({
      success: true,
      data: result.data,
      count: result.data.length,
    });
  }
}
