import prisma from '../src/utils/db.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data
  await prisma.notification.deleteMany();
  await prisma.threadReply.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.boardRevision.deleteMany();
  await prisma.exportJob.deleteMany();
  await prisma.inviteLink.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.element.deleteMany();
  await prisma.board.deleteMany();
  await prisma.template.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.oAuthAccount.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data.');

  // 2. Create Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const klein = await prisma.user.create({
    data: {
      email: 'klein@example.com',
      fullName: 'Klein Sefirah',
      password: passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Klein',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      fullName: 'Sarah Jenkins',
      password: passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
  });

  const alex = await prisma.user.create({
    data: {
      email: 'alex@example.com',
      fullName: 'Alex Rivera',
      password: passwordHash,
    },
  });

  console.log('👤 Created users: Klein, Sarah, Alex.');

  // 3. Create Templates
  await prisma.template.create({
    data: {
      title: 'Technical System Flow',
      description: 'Map out complex architecture and user logic with precision-aligned connectors.',
      category: 'Flowcharts',
      thumbnailUrl: 'https://placehold.co/600x400?text=Flowchart+Template',
      elements: [
        { type: 'rectangle', x: 100, y: 100, width: 150, height: 80, appearance: { fill: '#ffffff', stroke: '#000000' }, content: 'Start' },
        { type: 'arrow', points: [250, 140, 350, 140], appearance: { stroke: '#000000' } },
        { type: 'rectangle', x: 350, y: 100, width: 150, height: 80, appearance: { fill: '#ffffff', stroke: '#000000' }, content: 'Process' },
      ],
    },
  });

  await prisma.template.create({
    data: {
      title: 'Mind Map / Brainstorming',
      description: 'A freeform space for quick ideation and sticky note grouping.',
      category: 'Brainstorming',
      thumbnailUrl: 'https://placehold.co/600x400?text=Brainstorming+Template',
      elements: [],
    },
  });

  await prisma.template.create({
    data: {
      title: 'AWS Cloud Architecture',
      description: 'Pre-built service cards for VPC, EC2, S3, and RDS.',
      category: 'Design Systems',
      thumbnailUrl: 'https://placehold.co/600x400?text=AWS+Architecture',
      elements: [],
    },
  });

  console.log('📄 Created templates.');

  // 4. Create Boards for Klein
  await prisma.board.create({
    data: {
      title: 'YOLO/VAE Architecture',
      ownerId: klein.id,
      type: 'personal',
      badge: 'active-project',
      visibilityIcon: 'private',
      thumbnailUrl: 'https://placehold.co/600x400?text=YOLO+Architecture',
      elements: {
        create: [
          {
            type: 'rectangle',
            x: 200,
            y: 150,
            width: 200,
            height: 100,
            appearance: { fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 2 },
            content: 'Input Image',
            createdBy: klein.id,
          },
          {
            type: 'arrow',
            points: [400, 200, 500, 200],
            appearance: { stroke: '#2196f3', strokeWidth: 2 },
            createdBy: klein.id,
          },
          {
            type: 'rectangle',
            x: 500,
            y: 150,
            width: 200,
            height: 100,
            appearance: { fill: '#f3e5f5', stroke: '#9c27b0', strokeWidth: 2 },
            content: 'Feature Extractor',
            createdBy: klein.id,
          },
        ],
      },
    },
  });

  await prisma.board.create({
    data: {
      title: 'Legacy Project Snapshot',
      ownerId: klein.id,
      type: 'personal',
      status: 'archived',
      badge: 'archived',
      visibilityIcon: 'private',
    },
  });

  // 5. Create a Shared Board (Shared by Sarah with Klein)
  const sharedBoard = await prisma.board.create({
    data: {
      title: 'Marketing Strategy 2026',
      ownerId: sarah.id,
      sharedById: sarah.id,
      type: 'shared',
      badge: 'review-required',
      visibilityIcon: 'shared',
      collaborators: {
        create: [
          { userId: klein.id, role: 'editor' },
          { userId: alex.id, role: 'viewer' },
        ],
      },
    },
  });

  console.log('🗂️ Created boards and collaborations.');

  // 6. Create some initial comments/threads
  await prisma.thread.create({
    data: {
      boardId: sharedBoard.id,
      authorId: sarah.id,
      authorName: sarah.fullName,
      authorAvatarUrl: sarah.avatarUrl,
      message: 'Can we update the budget section?',
      status: 'open',
      replies: {
        create: [
          {
            authorId: klein.id,
            authorName: klein.fullName,
            authorAvatarUrl: klein.avatarUrl,
            message: 'On it! I will add the latest figures.',
          },
        ],
      },
    },
  });

  // 7. Create a notification for Klein
  await prisma.notification.create({
    data: {
      userId: klein.id,
      type: 'invite',
      message: 'Sarah Jenkins invited you to collaborate on "Marketing Strategy 2026".',
      boardId: sharedBoard.id,
    },
  });

  console.log('💬 Created threads and notifications.');
  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
