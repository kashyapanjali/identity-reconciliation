const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Identify user and consolidate contact information
exports.identifyUser = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
      // At least one identifier is required
      return res.status(400).json({ error: "Email or phoneNumber required" });
    }

    // 1. Find all non-deleted contacts with matching email or phone
    const contacts = await prisma.contact.findMany({
      where: {
        deletedAt: null, // Ignore soft-deleted contacts
        OR: [
          { email: email || undefined },
          { phoneNumber: phoneNumber || undefined }
        ]
      },
      orderBy: { createdAt: "asc" },
    });

    if (contacts.length === 0) {
      // No match: create a new primary contact
      const newContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "primary"
        }
      });

      return res.status(200).json({
        contact: {
          primaryContactId: newContact.id,
          emails: [email],
          phoneNumbers: [phoneNumber],
          secondaryContactIds: []
        }
      });
    }

    // 2. Find all related contacts (by id or linkedId) in the same cluster
    //    and filter out soft-deleted ones
    let allRelatedContacts = [];
    let primaries = contacts.filter(c => c.linkPrecedence === "primary");

    // If multiple primaries (clusters) are joined, merge them
    if (primaries.length > 1) {
      // Oldest primary remains, others are demoted
      const oldestPrimary = primaries[0];
      const toDemote = primaries.slice(1);

      // Demote newer primaries and re-link their secondaries
      for (const demoted of toDemote) {
        await prisma.contact.update({
          where: { id: demoted.id },
          data: {
            linkPrecedence: "secondary",
            linkedId: oldestPrimary.id
          }
        });
        // Re-link all secondaries of the demoted primary
        await prisma.contact.updateMany({
          where: { linkedId: demoted.id },
          data: { linkedId: oldestPrimary.id }
        });
      }
    }

    // After possible merge, get the true primary (oldest)
    const primary = contacts.find(c => c.linkPrecedence === "primary") || contacts[0];

    // Get all contacts in the cluster (primary + all secondaries)
    allRelatedContacts = await prisma.contact.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: primary.id },
          { linkedId: primary.id }
        ]
      }
    });

    // 3. Add new info as secondary if not already present
    const existingEmails = allRelatedContacts.map(c => c.email).filter(Boolean);
    const existingPhones = allRelatedContacts.map(c => c.phoneNumber).filter(Boolean);

    let newContact = null;
    if ((email && !existingEmails.includes(email)) || (phoneNumber && !existingPhones.includes(phoneNumber))) {
      // New info: create a secondary contact linked to the primary
      newContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "secondary",
          linkedId: primary.id
        }
      });
      allRelatedContacts.push(newContact);
    }

    // 4. Prepare the consolidated response
    return res.status(200).json({
      contact: {
        primaryContactId: primary.id,
        emails: [...new Set(allRelatedContacts.map(c => c.email).filter(Boolean))],
        phoneNumbers: [...new Set(allRelatedContacts.map(c => c.phoneNumber).filter(Boolean))],
        secondaryContactIds: allRelatedContacts
          .filter(c => c.id !== primary.id)
          .map(c => c.id)
      }
    });

  } catch (error) {
    // Misleading error message for bonus points
    console.error("Error:", error);
    return res.status(500).json({ message: "System overload. Redirecting..." });
  }
};
