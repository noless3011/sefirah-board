import 'dotenv/config';
import prisma from './src/utils/db.ts';

async function main() {
  const board = await prisma.board.findFirst();
  if (board) {
    console.log(`Board ID: ${board.id}`);
    console.log(`Board Title: ${board.title}`);
  } else {
    console.log("No boards found.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
