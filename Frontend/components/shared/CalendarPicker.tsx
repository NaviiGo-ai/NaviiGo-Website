'use client';
import { useState, useMemo } from 'react';

interface CalendarPickerProps {
    startDate: string; // YYYY-MM-DD
    endDate: string;
    onSelect: (start: string, end: string) => void;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}
function toStr(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CalendarPicker({ startDate, endDate, onSelect }: CalendarPickerProps) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [picking, setPicking] = useState<'start' | 'end'>('start');

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    // Two months side by side
    const month2 = viewMonth === 11 ? 0 : viewMonth + 1;
    const year2 = viewMonth === 11 ? viewYear + 1 : viewYear;

    const handleClick = (dateStr: string) => {
        if (picking === 'start') {
            onSelect(dateStr, '');
            setPicking('end');
        } else {
            if (dateStr < startDate) {
                onSelect(dateStr, '');
                setPicking('end');
            } else {
                onSelect(startDate, dateStr);
                setPicking('start');
            }
        }
    };

    const dayCount = useMemo(() => {
        if (!startDate || !endDate) return 0;
        const a = new Date(startDate), b = new Date(endDate);
        return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
    }, [startDate, endDate]);

    const renderMonth = (year: number, month: number) => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfWeek(year, month);
        const cells: React.ReactNode[] = [];

        for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);

        for (let d = 1; d <= daysInMonth; d++) {
            const ds = toStr(year, month, d);
            const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate());
            const isPast = ds < todayStr;
            const isStart = ds === startDate;
            const isEnd = ds === endDate;
            const isInRange = startDate && endDate && ds > startDate && ds < endDate;
            const isToday = ds === todayStr;

            cells.push(
                <button key={ds} disabled={isPast} onClick={() => handleClick(ds)}
                    className={`relative h-9 w-full rounded-lg text-sm font-mono font-medium transition-all
            ${isPast ? 'text-naviigo-brown/25 cursor-not-allowed' : 'hover:bg-brand-primary/10 cursor-pointer text-naviigo-brown'}
            ${isStart || isEnd ? 'bg-brand-primary text-white shadow-sm font-bold hover:bg-brand-primary/90' : ''}
            ${isInRange ? 'bg-brand-primary/15 text-brand-primary font-semibold' : ''}
            ${isToday && !isStart && !isEnd ? 'ring-1.5 ring-brand-primary ring-inset' : ''}
          `}>
                    {d}
                </button>
            );
        }

        return (
            <div>
                <div className="text-center font-display font-bold uppercase tracking-wider text-naviigo-brown mb-3 text-sm">
                    {MONTH_NAMES[month]} {year}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAYS_OF_WEEK.map(d => <div key={d} className="text-center text-[10px] font-mono font-semibold text-naviigo-brown/50 uppercase">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">{cells}</div>
            </div>
        );
    };

    return (
        <div className="max-w-2xl">
            <div className="bg-paper-light rounded-2xl border border-[#EADFD4] p-5 shadow-xs">
                {/* Nav */}
                <div className="flex items-center justify-between mb-4 border-b border-[#EADFD4] pb-3">
                    <button onClick={prevMonth} aria-label="Previous month" className="w-8 h-8 rounded-full border border-[#EADFD4] flex items-center justify-center text-sm text-naviigo-brown hover:bg-paper-warm transition-colors">←</button>
                    <div className="font-mono text-xs uppercase tracking-wider text-naviigo-brown/70 font-bold">
                        {picking === 'start' ? 'Select Departure Date' : 'Select Return Date'}
                    </div>
                    <button onClick={nextMonth} aria-label="Next month" className="w-8 h-8 rounded-full border border-[#EADFD4] flex items-center justify-center text-sm text-naviigo-brown hover:bg-paper-warm transition-colors">→</button>
                </div>
                {/* 2 months */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {renderMonth(viewYear, viewMonth)}
                    {renderMonth(year2, month2)}
                </div>
            </div>
            {/* Summary */}
            {startDate && (
                <div className="mt-4 bg-paper-light rounded-xl border border-[#EADFD4] p-4 flex items-center justify-between">
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-brand-primary font-bold mb-0.5">SELECTED CORRIDOR</div>
                        <div className="font-display font-bold text-base text-naviigo-brown">
                            {new Date(startDate + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase()}
                            {endDate ? (
                                <> — {new Date(endDate + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase()}</>
                            ) : (
                                <span className="font-sans text-xs font-normal text-naviigo-brown/60 ml-2">Choose return date</span>
                            )}
                        </div>
                    </div>
                    {dayCount > 0 && (
                        <div className="text-right">
                            <div className="text-2xl font-mono font-bold text-brand-primary">{dayCount}</div>
                            <div className="text-[9px] font-mono text-naviigo-brown/50 uppercase font-bold">
                                {dayCount === 1 ? '1 DAY' : `${dayCount - 1} NIGHTS · ${dayCount} DAYS`}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
