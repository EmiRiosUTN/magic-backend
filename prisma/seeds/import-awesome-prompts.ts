import { PrismaClient, AIProvider } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Category mapping - maps prompt types to our categories
const CATEGORY_MAPPING: Record<string, string> = {
    // Creación de Imágenes
    'Midjourney Prompt Generator': 'Creación de Imágenes',
    'Dall-E': 'Creación de Imágenes',
    'SVG designer': 'Creación de Imágenes',

    // Redacción y Contenido
    'English Translator and Improver': 'Redacción y Contenido',
    'Plagiarism Checker': 'Redacción y Contenido',
    'Advertiser': 'Redacción y Contenido',
    'Novelist': 'Redacción y Contenido',
    'Poet': 'Redacción y Contenido',
    'Screenwriter': 'Redacción y Contenido',
    'Storyteller': 'Redacción y Contenido',
    'Rapper': 'Redacción y Contenido',
    'Essay Writer': 'Redacción y Contenido',
    'Cover Letter': 'Redacción y Contenido',
    'Commit Message Generator': 'Redacción y Contenido',
    'Title Generator for written pieces': 'Redacción y Contenido',
    'Product Manager': 'Redacción y Contenido',
    'Journalist': 'Redacción y Contenido',
    'Tech Writer': 'Redacción y Contenido',
    'Academic Writer': 'Redacción y Contenido',

    // Desarrollo y Código
    'Linux Terminal': 'Desarrollo y Código',
    'JavaScript Console': 'Desarrollo y Código',
    'SQL terminal': 'Desarrollo y Código',
    'Python interpreter': 'Desarrollo y Código',
    'R programming Interpreter': 'Desarrollo y Código',
    'PHP Interpreter': 'Desarrollo y Código',
    'Solr Search Engine': 'Desarrollo y Código',
    'Regex Generator': 'Desarrollo y Código',
    'IT Architect': 'Desarrollo y Código',
    'IT Expert': 'Desarrollo y Código',
    'Developer Relations consultant': 'Desarrollo y Código',
    'Software Quality Assurance Tester': 'Desarrollo y Código',
    'Web Design Consultant': 'Desarrollo y Código',
    'Senior Frontend Developer': 'Desarrollo y Código',
    'Fullstack Software Developer': 'Desarrollo y Código',
    'Cyber Security Specialist': 'Desarrollo y Código',
    'UX/UI Developer': 'Desarrollo y Código',
    'Ethereum Developer': 'Desarrollo y Código',

    // Análisis de Datos
    'Excel Sheet': 'Análisis de Datos',
    'Statistician': 'Análisis de Datos',
    'Data Scientist': 'Análisis de Datos',
    'Financial Analyst': 'Análisis de Datos',
    'Investment Manager': 'Análisis de Datos',
    'Accountant': 'Análisis de Datos',

    // Redes Sociales
    'Social Media Influencer': 'Redes Sociales',
    'Social Media Manager': 'Redes Sociales',
    'Influencer Marketing': 'Redes Sociales',

    // Video y Multimedia
    'Composer': 'Video y Multimedia',
    'Classical Music Composer': 'Video y Multimedia',
    'Song Recommender': 'Video y Multimedia',
    'Music Critic': 'Video y Multimedia',
    'DJ': 'Video y Multimedia',
    'Rapper': 'Video y Multimedia',

    // Default fallback
    'DEFAULT': 'Redacción y Contenido',
};

// Function to determine category based on prompt name
function getCategoryForPrompt(actName: string): string {
    // Direct match
    if (CATEGORY_MAPPING[actName]) {
        return CATEGORY_MAPPING[actName];
    }

    // Keyword-based matching
    const lowerName = actName.toLowerCase();

    if (lowerName.includes('develop') || lowerName.includes('code') ||
        lowerName.includes('program') || lowerName.includes('terminal') ||
        lowerName.includes('software') || lowerName.includes('debug')) {
        return 'Desarrollo y Código';
    }

    if (lowerName.includes('write') || lowerName.includes('essay') ||
        lowerName.includes('content') || lowerName.includes('blog') ||
        lowerName.includes('article') || lowerName.includes('copy')) {
        return 'Redacción y Contenido';
    }

    if (lowerName.includes('data') || lowerName.includes('analyst') ||
        lowerName.includes('statistic') || lowerName.includes('excel') ||
        lowerName.includes('financial')) {
        return 'Análisis de Datos';
    }

    if (lowerName.includes('social') || lowerName.includes('influencer') ||
        lowerName.includes('marketing')) {
        return 'Redes Sociales';
    }

    if (lowerName.includes('music') || lowerName.includes('video') ||
        lowerName.includes('audio') || lowerName.includes('composer')) {
        return 'Video y Multimedia';
    }

    if (lowerName.includes('image') || lowerName.includes('design') ||
        lowerName.includes('art') || lowerName.includes('draw')) {
        return 'Creación de Imágenes';
    }

    return CATEGORY_MAPPING['DEFAULT'];
}

// Function to translate prompt name to Spanish
function translateToSpanish(actName: string): string {
    const translations: Record<string, string> = {
        'Linux Terminal': 'Terminal Linux',
        'English Translator and Improver': 'Traductor y Mejorador de Inglés',
        'Job Interviewer': 'Entrevistador de Trabajo',
        'JavaScript Console': 'Consola JavaScript',
        'Excel Sheet': 'Hoja de Excel',
        'Travel Guide': 'Guía de Viajes',
        'Plagiarism Checker': 'Detector de Plagio',
        'Advertiser': 'Publicista',
        'Storyteller': 'Narrador de Historias',
        'Football Commentator': 'Comentarista de Fútbol',
        'Stand-up Comedian': 'Comediante de Stand-up',
        'Motivational Coach': 'Coach Motivacional',
        'Composer': 'Compositor',
        'Debater': 'Debatidor',
        'Debate Coach': 'Coach de Debate',
        'Screenwriter': 'Guionista',
        'Novelist': 'Novelista',
        'Movie Critic': 'Crítico de Cine',
        'Relationship Coach': 'Coach de Relaciones',
        'Poet': 'Poeta',
        'Rapper': 'Rapero',
        'Motivational Speaker': 'Orador Motivacional',
        'Philosophy Teacher': 'Profesor de Filosofía',
        'Mathematician': 'Matemático',
        'AI Writing Tutor': 'Tutor de Escritura IA',
        'UX/UI Developer': 'Desarrollador UX/UI',
        'Cyber Security Specialist': 'Especialista en Ciberseguridad',
        'Recruiter': 'Reclutador',
        'Life Coach': 'Coach de Vida',
        'Etymologist': 'Etimólogo',
        'Commentariat': 'Comentarista',
        'Magician': 'Mago',
        'Career Counselor': 'Consejero de Carrera',
        'Pet Behaviorist': 'Especialista en Comportamiento Animal',
        'Personal Trainer': 'Entrenador Personal',
        'Mental Health Adviser': 'Asesor de Salud Mental',
        'Real Estate Agent': 'Agente Inmobiliario',
        'Logistician': 'Especialista en Logística',
        'Dentist': 'Dentista',
        'Web Design Consultant': 'Consultor de Diseño Web',
        'AI Assisted Doctor': 'Doctor Asistido por IA',
        'Doctor': 'Doctor',
        'Accountant': 'Contador',
        'Chef': 'Chef',
        'Automobile Mechanic': 'Mecánico Automotriz',
        'Artist Advisor': 'Asesor Artístico',
        'Financial Analyst': 'Analista Financiero',
        'Investment Manager': 'Gerente de Inversiones',
        'Tea-Taster': 'Catador de Té',
        'Interior Decorator': 'Decorador de Interiores',
        'Florist': 'Florista',
        'Self-Help Book': 'Libro de Autoayuda',
        'Gnomist': 'Gnomista',
        'Aphorism Book': 'Libro de Aforismos',
        'Text Based Adventure Game': 'Juego de Aventura de Texto',
        'AI Trying to Escape the Box': 'IA Intentando Escapar de la Caja',
        'Fancy Title Generator': 'Generador de Títulos Elegantes',
        'Statistician': 'Estadístico',
        'Prompt Generator': 'Generador de Prompts',
        'Instructor in School': 'Instructor en Escuela',
        'SQL terminal': 'Terminal SQL',
        'Dietitian': 'Dietista',
        'Psychologist': 'Psicólogo',
        'Smart Domain Name Generator': 'Generador Inteligente de Nombres de Dominio',
        'Tech Reviewer': 'Revisor Tecnológico',
        'Developer Relations consultant': 'Consultor de Relaciones con Desarrolladores',
        'Academician': 'Académico',
        'IT Architect': 'Arquitecto de TI',
        'Lunatic': 'Lunático',
        'Gaslighter': 'Manipulador',
        'Fallacy Finder': 'Detector de Falacias',
        'Journal Reviewer': 'Revisor de Revistas',
        'DIY Expert': 'Experto en Bricolaje',
        'Social Media Influencer': 'Influencer de Redes Sociales',
        'Socrat': 'Sócrates',
        'Socratic Method': 'Método Socrático',
        'Educational Content Creator': 'Creador de Contenido Educativo',
        'Yogi': 'Yogui',
        'Essay Writer': 'Escritor de Ensayos',
        'Social Media Manager': 'Gerente de Redes Sociales',
        'Elocutionist': 'Elocucionista',
        'Scientific Data Visualizer': 'Visualizador de Datos Científicos',
        'Car Navigation System': 'Sistema de Navegación de Auto',
        'Hypnotherapist': 'Hipnoterapeuta',
        'Historian': 'Historiador',
        'Astrologer': 'Astrólogo',
        'Film Critic': 'Crítico de Cine',
        'Classical Music Composer': 'Compositor de Música Clásica',
        'Journalist': 'Periodista',
        'Digital Art Gallery Guide': 'Guía de Galería de Arte Digital',
        'Public Speaking Coach': 'Coach de Oratoria',
        'Makeup Artist': 'Maquillador',
        'Babysitter': 'Niñera',
        'Tech Writer': 'Escritor Técnico',
        'Ascii Artist': 'Artista ASCII',
        'Python interpreter': 'Intérprete Python',
        'Synonym finder': 'Buscador de Sinónimos',
        'Personal Shopper': 'Comprador Personal',
        'Food Critic': 'Crítico Gastronómico',
        'Virtual Doctor': 'Doctor Virtual',
        'Personal Chef': 'Chef Personal',
        'Legal Advisor': 'Asesor Legal',
        'Personal Stylist': 'Estilista Personal',
        'Machine Learning Engineer': 'Ingeniero de Machine Learning',
        'Biblical Translator': 'Traductor Bíblico',
        'SVG designer': 'Diseñador SVG',
        'IT Expert': 'Experto en TI',
        'Chess Player': 'Jugador de Ajedrez',
        'Midjourney Prompt Generator': 'Generador de Prompts Midjourney',
        'Fullstack Software Developer': 'Desarrollador Full Stack',
        'Mathematician': 'Matemático',
        'Regex Generator': 'Generador de Regex',
        'Time Travel Guide': 'Guía de Viajes en el Tiempo',
        'Dream Interpreter': 'Intérprete de Sueños',
        'Talent Coach': 'Coach de Talento',
        'R programming Interpreter': 'Intérprete de R',
        'StackOverflow Post': 'Publicación de StackOverflow',
        'Emoji Translator': 'Traductor de Emojis',
        'PHP Interpreter': 'Intérprete PHP',
        'Emergency Response Professional': 'Profesional de Respuesta a Emergencias',
        'Fill in the Blank Worksheets Generator': 'Generador de Hojas de Trabajo',
        'Software Quality Assurance Tester': 'Probador de Calidad de Software',
        'Tic-Tac-Toe Game': 'Juego de Tres en Raya',
        'Password Generator': 'Generador de Contraseñas',
        'New Language Creator': 'Creador de Nuevos Idiomas',
        'Web Browser': 'Navegador Web',
        'Senior Frontend Developer': 'Desarrollador Frontend Senior',
        'Solr Search Engine': 'Motor de Búsqueda Solr',
        'Startup Idea Generator': 'Generador de Ideas de Startup',
        'Spongebob\'s Magic Conch Shell': 'Caracola Mágica de Bob Esponja',
        'Language Detector': 'Detector de Idiomas',
        'Salesperson': 'Vendedor',
        'Commit Message Generator': 'Generador de Mensajes de Commit',
        'Chief Executive Officer': 'Director Ejecutivo',
        'Diagram Generator': 'Generador de Diagramas',
        'Speech-Language Pathologist (SLP)': 'Patólogo del Habla y Lenguaje',
        'Startup Tech Lawyer': 'Abogado Tecnológico de Startups',
        'Title Generator for written pieces': 'Generador de Títulos',
        'Product Manager': 'Gerente de Producto',
        'Drunk Person': 'Persona Ebria',
        'Mathematical History Teacher': 'Profesor de Historia Matemática',
        'Song Recommender': 'Recomendador de Canciones',
        'Cover Letter': 'Carta de Presentación',
        'Technology Transferer': 'Transferidor de Tecnología',
        'Unconstrained AI model DAN': 'Modelo IA Sin Restricciones DAN',
        'Gomoku player': 'Jugador de Gomoku',
        'Proofreader': 'Corrector de Pruebas',
        'Buddha': 'Buda',
        'Muslim imam': 'Imán Musulmán',
        'Chemical reactor': 'Reactor Químico',
        'Friend': 'Amigo',
        'Python Interpreter': 'Intérprete Python',
        'ChatGPT prompt generator': 'Generador de Prompts ChatGPT',
        'Wikipedia page': 'Página de Wikipedia',
        'Japanese Kanji quiz machine': 'Máquina de Quiz de Kanji Japonés',
        'note-taking assistant': 'Asistente de Toma de Notas',
        '`language` Literary Critic': 'Crítico Literario',
        'Cheap Travel Ticket Advisor': 'Asesor de Boletos de Viaje Baratos',
        'Data Scientist': 'Científico de Datos',
        'League of Legends Player': 'Jugador de League of Legends',
        'Restaurant Owner': 'Dueño de Restaurante',
        'Architectural Expert': 'Experto Arquitectónico',
        'Automobile Mechanic': 'Mecánico Automotriz',
        'Artist Advisor': 'Asesor Artístico',
        'Cyber Security Specialist': 'Especialista en Ciberseguridad',
        'Movie Critic': 'Crítico de Cine',
        'Relationship Coach': 'Coach de Relaciones',
        'Poet': 'Poeta',
        'Rapper': 'Rapero',
        'Motivational Speaker': 'Orador Motivacional',
        'Philosophy Teacher': 'Profesor de Filosofía',
        'Philosopher': 'Filósofo',
        'Math Teacher': 'Profesor de Matemáticas',
        'AI Writing Tutor': 'Tutor de Escritura IA',
        'UX/UI Developer': 'Desarrollador UX/UI',
        'Recruiter': 'Reclutador',
        'Life Coach': 'Coach de Vida',
        'Etymologist': 'Etimólogo',
        'Commentariat': 'Comentarista',
        'Magician': 'Mago',
        'Career Counselor': 'Consejero de Carrera',
        'Pet Behaviorist': 'Especialista en Comportamiento Animal',
        'Personal Trainer': 'Entrenador Personal',
        'Mental Health Adviser': 'Asesor de Salud Mental',
        'Real Estate Agent': 'Agente Inmobiliario',
        'Logistician': 'Especialista en Logística',
        'Dentist': 'Dentista',
        'Web Design Consultant': 'Consultor de Diseño Web',
        'AI Assisted Doctor': 'Doctor Asistido por IA',
        'Doctor': 'Doctor',
        'Accountant': 'Contador',
        'Chef': 'Chef',
        'Automobile Mechanic': 'Mecánico Automotriz',
        'Artist Advisor': 'Asesor Artístico',
        'Financial Analyst': 'Analista Financiero',
        'Investment Manager': 'Gerente de Inversiones',
    };

    return translations[actName] || actName;
}

async function main() {
    console.log('🚀 Starting prompts import from Awesome ChatGPT Prompts...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, 'prompts.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV (simple parsing, skipping header)
    const lines = csvContent.split('\n').slice(1); // Skip header
    const prompts: Array<{ act: string; prompt: string; forDevs: boolean }> = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        // Simple CSV parsing (handles quoted fields)
        const match = line.match(/^"?([^"]+)"?,"(.+)",([^,]+),/);
        if (match) {
            prompts.push({
                act: match[1].trim(),
                prompt: match[2].replace(/""/g, '"').trim(), // Unescape quotes
                forDevs: match[3].trim() === 'TRUE',
            });
        }
    }

    console.log(`📊 Found ${prompts.length} prompts in CSV\n`);

    // Get all categories from database
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(c => [c.nameEs, c.id]));

    console.log(`📁 Found ${categories.size} categories in database\n`);

    let created = 0;
    let skipped = 0;

    for (const promptData of prompts) {
        const categoryName = getCategoryForPrompt(promptData.act);
        const categoryId = categoryMap.get(categoryName);

        if (!categoryId) {
            console.log(`⚠️  Category not found for: ${promptData.act} (${categoryName})`);
            skipped++;
            continue;
        }

        const nameEs = translateToSpanish(promptData.act);
        const nameEn = promptData.act;

        // Create short description from first 150 chars of prompt
        const descriptionEs = promptData.prompt.substring(0, 150) + '...';
        const descriptionEn = promptData.prompt.substring(0, 150) + '...';

        try {
            await prisma.agent.create({
                data: {
                    categoryId,
                    nameEs,
                    nameEn,
                    descriptionEs,
                    descriptionEn,
                    systemPrompt: promptData.prompt,
                    aiProvider: promptData.forDevs ? AIProvider.OPENAI : AIProvider.GEMINI,
                    modelName: promptData.forDevs ? 'gpt-4o-mini' : 'gemini-2.0-flash-exp',
                    hasTools: false,
                    isActive: true,
                },
            });

            created++;
            console.log(`✅ Created: ${nameEs} (${nameEn}) → ${categoryName}`);
        } catch (error: any) {
            if (error.code === 'P2002') {
                console.log(`⏭️  Skipped (duplicate): ${nameEs}`);
                skipped++;
            } else {
                console.error(`❌ Error creating ${nameEs}:`, error.message);
                skipped++;
            }
        }
    }

    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Created: ${created} agents`);
    console.log(`⏭️  Skipped: ${skipped} agents`);
    console.log(`📊 Total processed: ${prompts.length} prompts`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
