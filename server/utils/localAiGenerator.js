const normalizePrompt = (prompt) => prompt.replace(/\s+/g, ' ').trim();

const titleCase = (text) =>
    text
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

const extractRole = (prompt) => {
    const normalized = normalizePrompt(prompt);
    const roleMatch = normalized.match(/(?:for|as|role(?:\s+of)?|position(?:\s+of)?|job(?:\s+as)?|opportunity(?:\s+for)?)\s+([^.,\n]+)/i);

    if (roleMatch?.[1]) {
        return roleMatch[1].trim();
    }

    if (normalized.length <= 80) {
        return normalized;
    }

    return 'software engineer';
};

const extractCompany = (prompt) => {
    const normalized = normalizePrompt(prompt);
    const companyMatch = normalized.match(/(?:at|to|with|for)\s+([A-Z][A-Za-z0-9&.\- ]{1,40})/);
    return companyMatch?.[1]?.trim() || 'the hiring team';
};

const generateLocalEmail = (prompt) => {
    const role = titleCase(extractRole(prompt));
    const company = titleCase(extractCompany(prompt));

    return {
        subject: `${role} Ready To Add Value At ${company}`,
        emailBody: `Hi ${company},

I noticed your team is hiring for ${role}, and that immediately caught my attention.
Teams hiring for this kind of role usually need someone who can contribute quickly, write clean code, and take ownership of production work.
I bring hands-on experience building backend features, improving APIs, and solving implementation problems with a strong focus on reliability and execution.
I would welcome the opportunity to contribute to ${company} and discuss how my background fits the role.

Best regards,
Saurav Ratan
Software Engineer`,
        linkedInDM: `Hi, I came across the ${role} opening at ${company}. I have experience building production-ready backend features and improving system reliability, and I would love to connect briefly to share why I could be a strong fit for the role.`,
        followUpEmail: `Hi ${company},

Following up on my earlier note regarding the ${role} opportunity.
I remain very interested and believe I can contribute through strong engineering fundamentals, ownership, and reliable execution.
If helpful, I would be glad to share a short summary of relevant projects and backend work aligned with your hiring needs.

Best regards,
Saurav Ratan`,
        generationMode: 'local-template'
    };
};

module.exports = { generateLocalEmail };
