export function formatItineraryForWhatsApp(destName: string, planData: any): string {
    let text = `✈️ *NaviiGo Itinerary: Trip to ${destName}*\n\n`;

    if (!planData || !planData.dayPlans || !Array.isArray(planData.dayPlans)) {
        text += "Your custom itinerary is ready! Check it out using the link.";
        return text;
    }

    planData.dayPlans.forEach((day: any, index: number) => {
        text += `*Day ${index + 1}: ${day.theme || 'Exploration'}*\n`;
        if (day.activities && Array.isArray(day.activities)) {
            day.activities.forEach((act: any) => {
                const timeStr = act.time ? `${act.time} - ` : '';
                const emoji = act.time && act.time.toLowerCase().includes('am') ? '🌅' 
                            : (act.time && act.time.toLowerCase().includes('pm') && parseInt(act.time) > 4 ? '🌙' : '☀️');
                
                text += `${emoji} ${timeStr}${act.name}\n`;
            });
        }
        text += '\n';
    });

    text += `Build your own trip with AI at naviigo.com! 🌍`;
    return text;
}
