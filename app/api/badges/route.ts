import { NextResponse } from 'next/server';
import { BadgeService } from '@/lib/badges'; // Import the new service

export async function GET() {
    try {
        const badges = await BadgeService.findAllBadges();
        return NextResponse.json(badges);
    } catch (error: any) {
        console.error('Error fetching badges from DB:', error);
        return NextResponse.json(
            { error: 'Failed to fetch badges', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, icon, color } = body;

        if (!name || !description || !icon || !color) {
            return NextResponse.json({ error: 'Name, description, icon, and color are required for a badge' }, { status: 400 });
        }

        const existingBadge = await BadgeService.findBadgeByName(name);
        if (existingBadge) {
            return NextResponse.json({ error: 'Badge with this name already exists' }, { status: 409 });
        }

        const newBadge = await BadgeService.createBadge(name, description, icon, color);
        return NextResponse.json({ message: 'Badge added successfully', badge: newBadge }, { status: 201 });
    } catch (error: any) {
        console.error('Error adding badge to DB:', error);
        return NextResponse.json(
            { error: 'Failed to add badge', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}