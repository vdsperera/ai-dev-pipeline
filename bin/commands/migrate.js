/**
 * bin/commands/migrate.js — Non-destructive template migrator for AI Dev Pipeline
 */

'use strict';

const fs = require('fs');
const path = require('path');

function migrateTemplateTag(filePath, templateTag, headerRegex) {
  if (!fs.existsSync(filePath)) return { status: 'missing' };
  const content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(templateTag)) {
    return { status: 'current', filePath };
  }

  let updatedContent;
  if (headerRegex.test(content)) {
    updatedContent = content.replace(headerRegex, `$1\n\n<!-- ${templateTag} -->`);
  } else {
    updatedContent = `<!-- ${templateTag} -->\n\n${content}`;
  }

  fs.writeFileSync(filePath, updatedContent, 'utf8');
  return { status: 'upgraded', filePath, templateTag };
}

function migrateProjectTemplates(targetDir = process.cwd()) {
  const results = {
    upgraded: [],
    current: [],
    missing: []
  };

  const templates = [
    {
      file: path.join(targetDir, 'docs', 'anti-patterns.md'),
      tag: 'pipeline-template: anti-patterns/v2',
      header: /^(#[^\n]+)/
    },
    {
      file: path.join(targetDir, 'docs', 'architecture.md'),
      tag: 'pipeline-template: architecture/v1',
      header: /^(#[^\n]+)/
    },
    {
      file: path.join(targetDir, 'docs', 'tasks.md'),
      tag: 'pipeline-template: tasks/v1',
      header: /^(#[^\n]+)/
    }
  ];

  for (const t of templates) {
    const res = migrateTemplateTag(t.file, t.tag, t.header);
    const relPath = path.relative(targetDir, t.file);
    if (res.status === 'upgraded') {
      results.upgraded.push({ file: relPath, tag: t.tag });
    } else if (res.status === 'current') {
      results.current.push({ file: relPath, tag: t.tag });
    } else {
      results.missing.push({ file: relPath });
    }
  }

  return results;
}

async function commandMigrate(flags, context) {
  const { TARGET_DIR, BANNER, c } = context;
  console.log(BANNER);
  console.log(`${c.bold}🔄 AI Dev Pipeline Template Migration${c.reset}`);
  console.log(`   Target Directory: ${TARGET_DIR}\n`);

  const results = migrateProjectTemplates(TARGET_DIR);

  if (results.upgraded.length > 0) {
    console.log(`${c.green}Upgraded Templates:${c.reset}`);
    for (const u of results.upgraded) {
      console.log(`  ${c.green}✔${c.reset} ${u.file} → stamped with ${c.cyan}${u.tag}${c.reset}`);
    }
    console.log('');
  }

  if (results.current.length > 0) {
    console.log(`${c.dim}Already Up-to-Date Templates:${c.reset}`);
    for (const cur of results.current) {
      console.log(`  ${c.dim}-${c.reset} ${cur.file} (${cur.tag})`);
    }
    console.log('');
  }

  if (results.missing.length > 0) {
    console.log(`${c.yellow}Skipped (Not Found):${c.reset}`);
    for (const m of results.missing) {
      console.log(`  ${c.yellow}!${c.reset} ${m.file}`);
    }
    console.log('');
  }

  const totalProcessed = results.upgraded.length + results.current.length;
  if (results.upgraded.length > 0) {
    console.log(`${c.green}Migration complete! Successfully upgraded ${results.upgraded.length} template file(s).${c.reset}\n`);
  } else if (totalProcessed > 0) {
    console.log(`${c.green}All existing documentation templates are already up to date.${c.reset}\n`);
  } else {
    console.log(`${c.yellow}No documentation files found in docs/. Run init to scaffold templates.${c.reset}\n`);
  }
}

module.exports = {
  migrateTemplateTag,
  migrateProjectTemplates,
  commandMigrate
};
