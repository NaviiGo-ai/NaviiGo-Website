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
                    className={`relative h-9 w-full rounded-lg text-sm font-medium transition-all
            ${isPast ? 'text-muted-300 dark:text-muted-600 cursor-not-allowed' : 'hover:bg-jungle-green-50 dark:hover:bg-jungle-green-500/10 cursor-pointer'}
            ${isStart || isEnd ? 'bg-jungle-green-500 text-white shadow-md shadow-jungle-green-500/30 hover:bg-jungle-green-600' : ''}
            ${isInRange ? 'bg-jungle-green-100 dark:bg-jungle-green-500/15 text-jungle-green-800 dark:text-jungle-green-300' : ''}
            ${isToday && !isStart && !isEnd ? 'ring-2 ring-jungle-green-400 ring-inset' : ''}
            ${!isPast && !isStart && !isEnd && !isInRange ? 'text-muted-700 dark:text-muted-300' : ''}
          `}>
                    {d}
                </button>
            );
        }

        return (
            <div>
                <div className="text-center font-bold text-muted-800 dark:text-muted-200 mb-3 text-sm">
                    {MONTH_NAMES[month]} {year}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAYS_OF_WEEK.map(d => <div key={d} className="text-center text-[11px] font-semibold text-muted-400 uppercase">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">{cells}</div>
            </div>
        );
    };

    return (
        <div className="max-w-2xl">
            <div className="bg-white dark:bg-muted-800/50 rounded-2xl border border-muted-100 dark:border-muted-700 p-5">
                {/* Nav */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} aria-label="Previous month" className="w-8 h-8 rounded-full border border-muted-200 dark:border-muted-600 flex items-center justify-center text-sm hover:bg-muted-50 dark:hover:bg-muted-700 transition-colors">←</button>
                    <div className="text-xs text-muted-500 font-medium">
                        {picking === 'start' ? '📅 Select start date' : '📅 Select end date'}
                    </div>
                    <button onClick={nextMonth} aria-label="Next month" className="w-8 h-8 rounded-full border border-muted-200 dark:border-muted-600 flex items-center justify-center text-sm hover:bg-muted-50 dark:hover:bg-muted-700 transition-colors">→</button>
                </div>
                {/* 2 months */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {renderMonth(viewYear, viewMonth)}
                    {renderMonth(year2, month2)}
                </div>
            </div>
            {/* Summary */}
            {startDate && (
                <div className="mt-4 bg-jungle-green-50 dark:bg-jungle-green-500/10 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-jungle-green-600 text-lg">📅</span>
                        <div>
                            <div className="text-sm font-semibold text-muted-800 dark:text-muted-200">
                                {new Date(startDate + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {endDate && <> → {new Date(endDate + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                            </div>
                            {!endDate && <div className="text-xs text-muted-400">Now pick your return date</div>}
                        </div>
                    </div>
                    {dayCount > 0 && (
                        <div className="text-right">
                            <div className="text-2xl font-bold text-jungle-green-600">{dayCount}</div>
                            <div className="text-[10px] text-muted-400 uppercase font-bold">days</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
