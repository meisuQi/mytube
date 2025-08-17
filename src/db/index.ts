import { drizzle } from 'drizzle-orm/neon-http';
/* 使用 drizzle 初始化数据库连接。

通过环境变量 process.env.DATABASE_URL 获取数据库的连接地址。

使用 ! 非空断言运算符，告诉 TypeScript 编译器 DATABASE_URL 不会为 null 或 undefined，确保不会报错。

将数据库连接对象赋值给 db，用于后续查询和操作。 */
export const db = drizzle(process.env.DATABASE_URL!);
