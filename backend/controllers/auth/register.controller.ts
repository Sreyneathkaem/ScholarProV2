import { Request, Response } from "express";
import registerService from "@services/auth/register.service";
import { registerSchema, tokenUrl } from "@validation/user/auth.schema";


const registerController = async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);
    const  token  = tokenUrl.parse(req.params.token);
    const id = tokenUrl.parse(req.params.id);

    const result = await registerService(id,token, validatedData.email, validatedData.password);

    if (!result?.success) {
        return res.status(400).json({
            success: false,
            message: result?.msg || "Registration failed",
        })
    }

    return res.status(200).json({ success: true, message: result.msg });

}

export default registerController;