import { completeManualLogin } from '../server/xhs-collector.mjs';

try {
  await completeManualLogin();
  console.log('小红书登录会话已保存。');
} catch (error) {
  console.error('登录失败:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
