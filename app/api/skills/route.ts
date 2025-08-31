import { NextResponse } from 'next/server';
import { SkillService } from '@/lib/skills'; // Import the new service

export async function GET() {
    try {
        const skills = await SkillService.findAllSkills();
        // Return only the names for now, as the frontend expects an array of strings
        return NextResponse.json(skills.map(s => s.name));
    } catch (error: any) {
        console.error('Error fetching skills from DB:', error);
        return NextResponse.json(
            { error: 'Failed to fetch skills', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

// Optional: Add a POST endpoint for initial seeding or admin use
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, category } = body;

        if (!name) {
            return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
        }

        const existingSkill = await SkillService.findSkillByName(name);
        if (existingSkill) {
            return NextResponse.json({ error: 'Skill already exists' }, { status: 409 });
        }

        const newSkill = await SkillService.createSkill(name, category);
        return NextResponse.json({ message: 'Skill added successfully', skill: newSkill }, { status: 201 });
    } catch (error: any) {
        console.error('Error adding skill to DB:', error);
        return NextResponse.json(
            { error: 'Failed to add skill', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}