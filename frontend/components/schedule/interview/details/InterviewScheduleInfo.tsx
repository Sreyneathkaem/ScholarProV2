"use client";

import { CalendarIcon, Clock, Users, MapPin } from "lucide-react";

interface InterviewScheduleInfoProps {
  date: string;
  time: string;
  batch: string;
  roomName: string;
}

export function InterviewScheduleInfo({
  date,
  time,
  batch,
  roomName,
}: InterviewScheduleInfoProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Schedule Information
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Date
            </p>
            <p className="text-sm font-medium text-foreground">{date}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Clock className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Time
            </p>
            <p className="text-sm font-medium text-foreground">{time}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Batch
            </p>
            <p className="text-sm font-medium text-foreground">{batch}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <MapPin className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Room
            </p>
            <p className="text-sm font-medium text-foreground">{roomName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
