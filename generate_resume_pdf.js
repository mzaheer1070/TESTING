import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

function generateResume(outputPath) {
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 36, bottom: 36, left: 42, right: 42 }
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    const primaryColor = '#0f172a';
    const subHeaderBg = '#dbeafe';
    const subHeaderColor = '#1e3a8a';
    const bodyColor = '#334155';
    const linkColor = '#1d4ed8';

    // Helper: Draw Section Banner
    function drawSectionTitle(title) {
        doc.moveDown(0.6);
        const y = doc.y;
        doc.rect(42, y, doc.page.width - 84, 18).fill(subHeaderBg);
        doc.fillColor(subHeaderColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(title, 48, y + 4);
        doc.y = y + 24;
    }

    // --- HEADER ---
    doc.fillColor(primaryColor)
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('MUHAMMAD ZAHEER', { align: 'center', characterSpacing: 1 });

    doc.fillColor('#475569')
       .fontSize(12)
       .font('Helvetica')
       .text('Computer Science Student', { align: 'center' });

    doc.moveDown(0.3);

    doc.fontSize(9.5).font('Helvetica');
    const contactLine = 'mzaheer1070@gmail.com   |   +92-302-3185767   |   Islamabad, Pakistan';
    doc.fillColor(linkColor).text(contactLine, { align: 'center' });

    // --- SUMMARY ---
    drawSectionTitle('SUMMARY');
    doc.fillColor(bodyColor)
       .fontSize(9.5)
       .font('Helvetica')
       .text(
           'Computer Science student at National University of Technology with hands-on experience in software development, machine learning fundamentals, data preprocessing, and web technologies. Skilled in Python, C/C++, SQL, Firebase, and AI-related workflows. Experienced in building academic and personal projects, including AI-powered applications and portfolio websites. Seeking internship opportunities in Software Development, AI/ML, Data Science, or related technology fields.',
           { align: 'justify', lineGap: 2.5 }
       );

    // --- KEY SKILLS ---
    drawSectionTitle('KEY SKILLS');
    const skillsY = doc.y;
    const colWidth = (doc.page.width - 84) / 5;

    const skillsData = [
        { title: 'Languages', items: ['Python', 'C', 'C++', 'SQL', 'Kotlin', 'JavaScript'] },
        { title: 'Web', items: ['HTML', 'CSS', 'JavaScript', 'Firebase', 'GitHub'] },
        { title: 'Databases', items: ['MySQL', 'MongoDB', 'Neo4j'] },
        { title: 'AI & Data Science', items: ['Data Cleaning', 'Data Preprocessing', 'Data Visualization', 'Model Training', 'Labeled / Unlabeled'] },
        { title: 'Tools', items: ['Linux', 'Docker', 'Firebase', 'Google ML Kit'] }
    ];

    skillsData.forEach((col, i) => {
        const x = 42 + (i * colWidth);
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(col.title, x, skillsY);
        let itemY = skillsY + 14;
        col.items.forEach(item => {
            doc.fillColor('#334155').font('Helvetica').fontSize(8.5).text(`• ${item}`, x, itemY, { width: colWidth - 6 });
            itemY = doc.y;
        });
    });

    doc.y = skillsY + 84;

    // --- PROJECTS ---
    drawSectionTitle('PROJECTS');

    const projects = [
        {
            title: 'AI Translation Mobile Application',
            tech: 'Android, Java/Kotlin, ML Kit',
            points: [
                'Developed an Android translation app with real-time language support.',
                'Used Google ML Kit for text translation.'
            ]
        },
        {
            title: 'Personal Portfolio Website',
            tech: 'HTML, CSS, JavaScript, Firebase',
            points: [
                'Built and deployed a responsive portfolio website showcasing projects and skills.',
                'Integrated contact form using Firebase. Hosted on GitHub Pages.'
            ]
        },
        {
            title: 'Weather Dashboard Pro & API Status Monitor',
            tech: 'HTML5, CSS3, Modern JavaScript, REST APIs, LocalStorage',
            points: [
                'Real-time meteorological forecast engine featuring Open-Meteo API, live AQI pollutants, UV safety index, and unit toggling.',
                'Built latency and uptime probing dashboard with automated REST endpoint health checking and millisecond metrics.'
            ]
        }
    ];

    projects.forEach(p => {
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text(p.title);
        p.points.forEach(pt => {
            doc.fillColor(bodyColor).font('Helvetica').fontSize(9).text(`  •  ${pt}`, { lineGap: 1.5 });
        });
        doc.fillColor('#475569').font('Helvetica-Oblique').fontSize(8.5).text(`     Tech: ${p.tech}`);
        doc.moveDown(0.4);
    });

    // --- EDUCATION ---
    drawSectionTitle('EDUCATION');
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text('Bachelor of Science in Computer Science', { continued: true });
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8.5).text('                Expected Graduation: June, 2027', { align: 'right' });
    doc.fillColor('#1e293b').font('Helvetica').fontSize(9).text('National University of Technology, Islamabad');
    doc.fillColor(bodyColor).font('Helvetica').fontSize(8.5).text('Relevant Coursework: Data Structures & Algorithms, Database Systems, Machine Learning, Web Development, Object Oriented Programming');

    // --- LANGUAGES & INTERESTS ---
    doc.moveDown(0.6);
    const twoColY = doc.y;
    const halfWidth = (doc.page.width - 84) / 2;

    // Col 1: Languages
    doc.rect(42, twoColY, halfWidth - 8, 16).fill(subHeaderBg);
    doc.fillColor(subHeaderColor).font('Helvetica-Bold').fontSize(9).text('LANGUAGES', 48, twoColY + 3.5);
    let langY = twoColY + 22;
    const langs = ['Urdu — Native', 'English — Upper Intermediate (B2)', 'Punjabi — Native'];
    langs.forEach(l => {
        doc.fillColor(bodyColor).font('Helvetica').fontSize(8.5).text(`•  ${l}`, 48, langY);
        langY += 13;
    });

    // Col 2: Interests
    const col2X = 42 + halfWidth + 8;
    doc.rect(col2X, twoColY, halfWidth - 8, 16).fill(subHeaderBg);
    doc.fillColor(subHeaderColor).font('Helvetica-Bold').fontSize(9).text('INTERESTS', col2X + 6, twoColY + 3.5);
    let intY = twoColY + 22;
    const interests = ['Artificial Intelligence', 'Machine Learning', 'Mobile App Development', 'Automation'];
    interests.forEach(it => {
        doc.fillColor(bodyColor).font('Helvetica').fontSize(8.5).text(`•  ${it}`, col2X + 6, intY);
        intY += 13;
    });

    doc.end();

    writeStream.on('finish', () => {
        console.log(`Successfully generated resume PDF at: ${outputPath}`);
    });
}

generateResume(path.join(process.cwd(), 'public', 'Muhammad_Zaheer_Resume.pdf'));
generateResume(path.join(process.cwd(), 'Muhammad_Zaheer_Resume.pdf'));
