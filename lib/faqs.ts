/**
 * Frequently asked questions. Answers describe how PigMaster actually works; update them
 * whenever plans, limits or features change. Plain text only (also used for search and
 * the FAQPage structured data).
 */
export type Faq = { q: string; a: string };
export type FaqCategory = { id: string; title: string; items: Faq[] };

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        q: "What is PigMaster?",
        a: "PigMaster is farm management software for pig farmers. It keeps your herd, pens, breeding, health, feeding, sales and reports in one place, reminds you what is due, and lets your team record work from their phones.",
      },
      {
        q: "How do I set up my farm?",
        a: "Create your farm, then add a row for each house or building. PigMaster creates the pens for each row for you. Then add your pigs to pens. After that you can record breeding, health work, feeding and sales.",
      },
      {
        q: "Can I use PigMaster on my phone?",
        a: "Yes. It works in any modern phone browser, and you can install it on your home screen so it opens like an app. The \"Install PigMaster on your phone\" video under Tutorials shows how.",
      },
      {
        q: "Do I need internet?",
        a: "Yes, an internet connection is needed to load and save records, so your whole team always sees the same, up-to-date information.",
      },
    ],
  },
  {
    id: "plans",
    title: "Plans & payments",
    items: [
      {
        q: "Is there a free trial?",
        a: "Yes. Every new farm gets a free trial with access to every feature. No payment details are needed to start. When the trial ends your farm moves to the Free plan and none of your records are deleted.",
      },
      {
        q: "What is included in the Free plan?",
        a: "The Free plan covers the overview, pens and breeding with up to 3 rows, 54 pigs and 1 user. Standard adds health, feeding, earnings, exports and up to 3 team members. Advanced unlocks everything, including reports, analytics and the calendar, with no limits on rows, pigs or team members.",
      },
      {
        q: "Does the price depend on how many pigs I have?",
        a: "Yes. Each paid plan includes a number of pigs in its base price, and every extra live pig adds a small monthly amount, so small farms pay less and large farms pay in line with their herd. Sold, deceased and deleted pigs are not counted. The Pricing page shows your exact price for your current herd before you pay.",
      },
      {
                q: "How do I pay?",
        a: "With M-Pesa. Choose a plan, enter your M-Pesa number and approve the payment prompt on your phone with your PIN. Your plan starts as soon as M-Pesa confirms the payment.",
      },
      {
        q: "I paid but my plan has not changed. What should I do?",
        a: "M-Pesa confirmations usually arrive within a minute. If they are delayed, PigMaster checks pending payments with M-Pesa automatically every few minutes, and you can see the status under Settings → Billing & plan. If it still shows pending after 15 minutes, contact support with your M-Pesa receipt number.",
      },
      {
        q: "Will I be charged automatically?",
        a: "No. Plans are prepaid and nothing is taken from your M-Pesa without you approving it on your phone. Settings → Billing & plan warns you a week before your plan ends so you can renew in time.",
      },
      {
        q: "What happens when my plan expires?",
        a: "Your farm moves to the Free plan. All your records stay safe; premium screens are locked until you renew.",
      },
      {
        q: "Can I get a refund?",
        a: "If you paid by mistake or something went wrong with a payment, contact support with your M-Pesa receipt number and we will review it.",
      },
    ],
  },
  {
    id: "team",
    title: "Team & access",
    items: [
      {
        q: "Can my farm workers use PigMaster?",
        a: "Yes. The farm owner adds people under Settings → Team & access and gives each one a role: Farm manager, Farm worker or Viewer. They receive an email to set their password and then see the same farm.",
      },
      {
        q: "What can each role do?",
        a: "Each role allows a set of actions, for example a Farm worker can record feeding and health work but cannot delete records, export data or see earnings. You can see exactly what each role allows on the Team & access screen. Roles are maintained by PigMaster so they stay consistent and safe.",
      },
      {
        q: "How many people can I add?",
        a: "The Free plan includes 1 user (the owner), Standard up to 3 people and Advanced has no limit. Team members use the farm's plan, so they do not need their own subscription.",
      },
      {
        q: "Can one person work on more than one farm?",
        a: "Yes. If you are on more than one farm, switch between them from the farm name at the top of the screen.",
      },
    ],
  },
  {
    id: "records",
    title: "Farm records",
    items: [
      {
        q: "How does PigMaster suggest how much to feed?",
        a: "It uses common daily rations per pig for each stage, such as weaners, growers, finishers, dry, pregnant and lactating sows and boars, and adds them up per pen. You can adjust the amount before saving. The figures are general guidance; confirm rations with your feed supplier, nutritionist or vet.",
      },
      {
        q: "Will I be reminded about vaccinations and farrowing?",
        a: "Yes. Scheduled health work and next doses, heat checks 21 days after mating, expected farrowing and weaning dates appear on the overview, in the calendar, and can be emailed to you. Choose which emails you get under Settings → Notifications.",
      },
      {
        q: "Can I export my records?",
        a: "Yes. Health, feeding, earnings and reports can be exported to Excel or CSV for any date range, for example to share with a vet, a buyer or your accountant.",
      },
      {
        q: "Can I use my own currency?",
        a: "Yes. Each farm records prices in its own currency, and you can view amounts in another currency using daily exchange rates from the Display settings.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Data & privacy",
    items: [
      {
        q: "Who owns my farm data?",
        a: "You do. We only use it to provide and improve PigMaster as explained in our Privacy Policy, and we never sell it.",
      },
      {
        q: "Can other farmers see my records?",
        a: "No. Each farm's records are kept separate and are only visible to the people you add to your farm. PigMaster staff can access accounts only to provide support or keep the service secure, and that access is logged.",
      },
      {
        q: "How do I delete my account or get a copy of my data?",
        a: "Export your records at any time from the app. To receive everything we hold about you or to delete your account, contact support; your rights are explained in the Privacy Policy.",
      },
    ],
  },
];

/** Billing questions shown on the pricing page. */
export const PRICING_FAQS = FAQ_CATEGORIES.find(category => category.id === "plans")!.items;
