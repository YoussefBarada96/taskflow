// Demo data for portfolio screenshots and the live demo. Safe to re-run: it only resets the
// demo workspace and the two demo users, never anything else.
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo-password-123";
const TEAMMATE_EMAIL = "sam@example.com";
const WORKSPACE_NAME = "Acme Product Team";

const daysFromNow = (days) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
};

const ordered = (items) => items.map((item, index) => ({ ...item, position: index + 1 }));

async function seed() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  // The teammate exists only to make the demo look collaborative; nobody can log in as them.
  const teammateHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);

  const demo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "Demo User", passwordHash },
    create: { email: DEMO_EMAIL, name: "Demo User", passwordHash },
  });
  const sam = await prisma.user.upsert({
    where: { email: TEAMMATE_EMAIL },
    update: { name: "Sam Rivera", passwordHash: teammateHash },
    create: { email: TEAMMATE_EMAIL, name: "Sam Rivera", passwordHash: teammateHash },
  });

  await prisma.workspace.deleteMany({ where: { ownerId: demo.id, name: WORKSPACE_NAME } });

  const task = (title, extra = {}) => ({ title, ...extra });

  await prisma.workspace.create({
    data: {
      name: WORKSPACE_NAME,
      ownerId: demo.id,
      memberships: {
        create: [
          { userId: demo.id, role: "OWNER" },
          { userId: sam.id, role: "MEMBER" },
        ],
      },
      boards: {
        create: [
          {
            name: "Website Redesign",
            lists: {
              create: ordered([
                {
                  name: "Backlog",
                  tasks: {
                    create: ordered([
                      task("Audit current site analytics", {
                        description: "Pull the last 90 days of traffic and conversion data to find the pages worth keeping.",
                        assigneeId: sam.id,
                        dueDate: daysFromNow(9),
                      }),
                      task("Draft new information architecture", {
                        description: "Sitemap v2: fewer top-level pages, clearer paths to pricing and sign-up.",
                        dueDate: daysFromNow(12),
                      }),
                      task("Collect competitor screenshots"),
                    ]),
                  },
                },
                {
                  name: "In Progress",
                  tasks: {
                    create: ordered([
                      task("Design homepage hero", {
                        description: "Three layout options for the hero section, with mobile variants.",
                        assigneeId: demo.id,
                        dueDate: daysFromNow(3),
                        comments: {
                          create: [
                            { body: "Option B tests best with the sales team. Let's refine that one.", authorId: sam.id },
                            { body: "Agreed. I'll share updated mockups tomorrow.", authorId: demo.id },
                          ],
                        },
                      }),
                      task("Set up staging environment", {
                        assigneeId: sam.id,
                        dueDate: daysFromNow(2),
                      }),
                    ]),
                  },
                },
                {
                  name: "In Review",
                  tasks: {
                    create: ordered([
                      task("Write new pricing page copy", {
                        description: "Copy is drafted; waiting on legal to review the plan comparison table.",
                        assigneeId: demo.id,
                        dueDate: daysFromNow(1),
                        comments: {
                          create: [{ body: "Legal signed off on the footnotes. Just the enterprise row left.", authorId: sam.id }],
                        },
                      }),
                    ]),
                  },
                },
                {
                  name: "Done",
                  tasks: {
                    create: ordered([
                      task("Kickoff meeting and goals", { assigneeId: demo.id }),
                      task("Brand colour and type refresh", { assigneeId: sam.id }),
                    ]),
                  },
                },
              ]),
            },
          },
          {
            name: "Q4 Roadmap",
            lists: {
              create: ordered([
                {
                  name: "Planned",
                  tasks: {
                    create: ordered([
                      task("Mobile app beta", { dueDate: daysFromNow(45), assigneeId: sam.id }),
                      task("Team dashboards", { dueDate: daysFromNow(60) }),
                    ]),
                  },
                },
                {
                  name: "Building",
                  tasks: {
                    create: ordered([
                      task("Single sign-on", {
                        description: "SAML and Google Workspace login for larger teams.",
                        assigneeId: demo.id,
                        dueDate: daysFromNow(21),
                      }),
                    ]),
                  },
                },
                { name: "Shipped", tasks: { create: ordered([task("Dark mode")]) } },
              ]),
            },
          },
        ],
      },
    },
  });
}

async function main() {
  // The database is remote, so tolerate a brief connection blip before giving up.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await seed();
      console.log(`Seeded demo data. Log in as ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
      return;
    } catch (error) {
      if (attempt === 3) throw error;
      console.warn(`Attempt ${attempt} failed (${error.code ?? error.name}); retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
