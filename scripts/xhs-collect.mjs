import { collectTracksOnce } from '../server/xhs-collector.mjs';

try {
  const result = await collectTracksOnce();
  console.log(`采集完成：已写入 ${result.savedCount} 条内容，覆盖 ${result.tracks} 个赛道。`);
} catch (error) {
  console.error('采集失败:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
