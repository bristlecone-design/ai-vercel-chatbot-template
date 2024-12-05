type emailType = string | null | undefined;

export function isEmailInOkayLists(email: emailType): boolean {
  let isAllowed = false;

  // First, check if the email is in the allowed domain list
  let allowedDomains: string | string[] | undefined =
    process.env.ALLOWED_DOMAINS;
  if (typeof allowedDomains === 'string') {
    allowedDomains = allowedDomains.split(',').map((e) => e?.trim());
  }

  let allowedEmails: string | string[] | undefined = process.env.ALLOWED_EMAILS;
  if (typeof allowedEmails === 'string') {
    allowedEmails = allowedEmails.split(',').map((e) => e?.trim());
  }

  if (allowedDomains && email) {
    isAllowed = allowedDomains.some((domain) => {
      return email.includes(domain);
    });

    // If domain is not allowed, check if the email is in the special safe list
    if (!isAllowed && allowedEmails?.length) {
      isAllowed = allowedEmails.some((allowedEmail) => {
        if (!allowedEmail) return false;
        return email === allowedEmail || email.includes(allowedEmail);
      });
    }
  }

  return isAllowed;
}

export function isEmailInNotOkayList(email: emailType) {
  let isNotAllowed = false;
  // Check the not allowed list
  let blockedEmails: string | string[] | undefined = process.env.BLOCKED_LIST;
  if (blockedEmails && blockedEmails.length && email) {
    if (typeof blockedEmails === 'string') {
      blockedEmails = blockedEmails.split(',').map((e) => e?.trim());
    }
    // Blocks by specific email or domain
    const emailFound = blockedEmails.some((blockedEmail) => {
      return email === blockedEmail || email.includes(blockedEmail);
    });
    // console.log(`emailFound?`, emailFound, email);

    if (emailFound) {
      isNotAllowed = true;
    }
  }

  return isNotAllowed;
}
