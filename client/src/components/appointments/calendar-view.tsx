import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function CalendarView({ selectedDate, onDateChange }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  
  // Handle next month navigation
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Handle previous month navigation
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    onDateChange(today);
  };
  
  // Prepare date range for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day names for the header
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
  // Fetch appointments for the visible month
  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments", {
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString()
    }],
  });
  
  // Helper to check if a date has appointments
  const getAppointmentsForDate = (date: Date) => {
    if (!appointments) return [];
    
    return appointments.filter((appointment: any) => {
      const appointmentDate = new Date(appointment.date);
      return isSameDay(appointmentDate, date);
    });
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold text-neutral-800 text-lg">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={goToToday}>Hoje</Button>
            {/* View options could be implemented here */}
          </div>
        </div>
        
        {/* Calendar grid */}
        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-neutral-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 border-t border-l border-neutral-200">
            {/* Generate previous month days to fill the grid */}
            {Array.from({ length: monthStart.getDay() }).map((_, index) => (
              <div key={`prev-${index}`} className="h-24 border-r border-b border-neutral-200 p-1 text-neutral-400">
                <div className="text-right"></div>
              </div>
            ))}
            
            {/* Current month days */}
            {daysInMonth.map((day) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const dayAppointments = getAppointmentsForDate(day);
              
              return (
                <div 
                  key={day.toString()}
                  className={cn(
                    "h-24 border-r border-b border-neutral-200 p-1 cursor-pointer hover:bg-blue-50/50 transition-colors",
                    isToday && "bg-blue-50",
                    isSelected && "bg-blue-100"
                  )}
                  onClick={() => onDateChange(day)}
                >
                  <div className={cn(
                    "text-right font-medium",
                    isToday && "text-primary",
                    isSelected && "font-bold"
                  )}>
                    {format(day, "d")}
                  </div>
                  
                  {/* Appointment indicators */}
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {dayAppointments.slice(0, 3).map((appointment: any) => (
                      <div 
                        key={appointment.id}
                        className="text-xs bg-primary text-white p-1 rounded truncate"
                        title={`${format(new Date(appointment.date), "HH:mm")} - ${appointment.client?.name || 'Cliente'}`}
                      >
                        {format(new Date(appointment.date), "HH:mm")} - {appointment.client?.name?.split(' ')[0] || 'Cliente'}
                      </div>
                    ))}
                    
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-neutral-500 text-right">
                        +{dayAppointments.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Generate next month days to fill the grid */}
            {Array.from({ length: (7 - (monthStart.getDay() + daysInMonth.length) % 7) % 7 }).map((_, index) => (
              <div key={`next-${index}`} className="h-24 border-r border-b border-neutral-200 p-1 text-neutral-400">
                <div className="text-right"></div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
