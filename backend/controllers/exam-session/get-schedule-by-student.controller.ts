import { getScheduleByStudent } from "@services/exam-session/get-schedule-by-student.service";
import { Request, Response } from "express";

export default async (req: Request, res: Response) => {
    const userId = String(req.user?.id);
    const result = await getScheduleByStudent(userId);

    if (!result || !result.success) {
        res.status(404).json({ success: false, message: result?.msg || "Not found" });
        return;
    }

    res.status(200).json({ success: true, data: result.data });
}
