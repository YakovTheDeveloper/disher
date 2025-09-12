#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

// Get CLI args
const [, , targetPath, componentName] = process.argv;

if (!targetPath || !componentName) {
  console.error("❌ Usage: node create-boilerplate-component.js <absolutePath> <specificName>");
  process.exit(1);
}

// Component folder path
const componentDir = join(targetPath, componentName);

// Create folder
if (!existsSync(componentDir)) {
  mkdirSync(componentDir, { recursive: true });
  console.log(`📁 Created folder: ${componentDir}`);
} else {
  console.error("⚠️ Folder already exists. Exiting...");
  process.exit(1);
}

// Files content
const scssContent = `.container {
    
}
`;

const tsxContent = `import { observer } from "mobx-react-lite";
                    import styles from './${componentName}.module.scss'
type Props = {
  children: React.ReactNode;
}

const ${componentName} = ({ children }: Props) => {
  return (
    <div className={styles.container}>${componentName}</div>
  )
}

export default observer(${componentName});
`;

const indexContent = `export { default as ${componentName} } from "./${componentName}.tsx";
`;

// File paths
const scssPath = join(componentDir, `${componentName}.module.scss`);
const tsxPath = join(componentDir, `${componentName}.tsx`);
const indexPath = join(componentDir, "index.ts");

// Write files
writeFileSync(scssPath, scssContent, "utf8");
writeFileSync(tsxPath, tsxContent, "utf8");
writeFileSync(indexPath, indexContent, "utf8");

console.log(`✅ Component ${componentName} created successfully!`);
