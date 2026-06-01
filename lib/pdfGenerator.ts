import { jsPDF } from 'jspdf';

export function downloadItineraryAsPDF(destName: string, planData: any) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    const margin = 20;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont("helvetica", "bold");
    doc.text(`NaviiGo Itinerary: ${destName}`, margin, yPos);
    yPos += 10;

    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont("helvetica", "normal");
    doc.text('Your personalized AI travel plan', margin, yPos);
    yPos += 15;

    // Separator Line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    if (planData && planData.dayPlans && Array.isArray(planData.dayPlans)) {
        planData.dayPlans.forEach((day: any, index: number) => {
            // Check page break
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            // Day Header
            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.setFont("helvetica", "bold");
            doc.text(`Day ${index + 1}: ${day.theme || 'Exploration'}`, margin, yPos);
            yPos += 10;

            if (day.activities && Array.isArray(day.activities)) {
                day.activities.forEach((act: any) => {
                    // Check page break
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }

                    // Activity Time
                    doc.setFontSize(10);
                    doc.setTextColor(14, 165, 233); // sky-500
                    doc.setFont("helvetica", "bold");
                    const timeStr = act.time ? `${act.time}  ` : '';
                    doc.text(timeStr, margin, yPos);
                    
                    // Activity Name
                    doc.setTextColor(71, 85, 105); // slate-600
                    doc.setFont("helvetica", "normal");
                    doc.text(act.name, margin + 25, yPos);
                    
                    // Activity Description (if we want to add it, maybe split text)
                    if (act.description) {
                        yPos += 5;
                        doc.setFontSize(9);
                        doc.setTextColor(148, 163, 184); // slate-400
                        const splitDesc = doc.splitTextToSize(act.description, pageWidth - margin * 2 - 25);
                        doc.text(splitDesc, margin + 25, yPos);
                        yPos += (splitDesc.length * 4); // roughly 4mm per line
                    }
                    
                    yPos += 8;
                });
            }
            yPos += 5;
        });
    } else {
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        doc.text('Itinerary details will appear here.', margin, yPos);
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Powered by NaviiGo AI (naviigo.com)', margin, 285);

    // Trigger Download
    doc.save(`NaviiGo-Trip-To-${destName.replace(/\s+/g, '-')}.pdf`);
}
