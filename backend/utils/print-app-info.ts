import chalk from "chalk";

const primaryChalk = chalk.blue;

const label = (text: string): string => {
  const labelChalk = chalk.white.bold;
  const icon = primaryChalk("✔");
  return `${icon} ${labelChalk(text)}`;
};

export const HR = (
  color = "white",
  char: string = "-",
  length: number = 60
): string => {
  return ((chalk as any)[color] as any)(`${char}`.repeat(length));
};

export const printAppInfo = (port: any, env: any) => {
  const serverSuccessMessage = primaryChalk.bold(
    "🚀 Server successfully started"
  );
  console.log(`
      \r${serverSuccessMessage}\n
      \r${label("API URL")}: ${primaryChalk(port)}\n
      \r${label("ENV")}: ${primaryChalk(env?.toUpperCase())}\n
    `);
};
