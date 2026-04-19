---
name: baby-tracker
version: 1.0.0
status: draft
created: 2026-04-12
updated: 2026-04-12
mvp_target: 2026-04-26
---

# 宝宝护理追踪器

> 一款面向新手父母的宝宝护理记录工具——追踪喂奶/吸奶、尿布更换、体重变化，支持提醒，家庭数据同步共享。

## 背景

- **目标用户**：新手爸爸/妈妈
- **核心用户**：零号的妻子
- **现有方案**：纸笔、脑子记、Excel ——容易忘、不方便、不直观
- **为什么更好**：随时打开就能记，两人数据实时同步，不漏掉任何一次记录

## 功能范围

### MVP（两周目标）

- [x] **宝宝档案**：姓名、出生日期、性别
- [x] **喂奶记录**：时间、奶量（ml）、奶源（母乳/奶粉）、备注
- [x] **吸奶记录**：时间、吸奶量（ml）、左右侧
- [x] **换尿布记录**：时间、类型（尿布/便便/两者都有）
- [x] **体重记录**：日期、体重（kg）、手动录入
- [x] **首页仪表盘**：今日摘要（今日喂奶次数、换尿布次数、最近体重）
- [x] **时间线**：按时间倒序展示所有记录，一目了然
- [x] **提醒功能**：定时提醒吸奶（可设置间隔）、换尿布（建议间隔）
- [x] **账号系统**：简单邮箱登录，双方共用宝宝档案
- [x] **数据同步**：夫妻双方实时同步，云端存储

### 暂时不做

- 睡眠记录
- 体温记录
- 成长曲线图表（体重/身高）
- 照片/视频记录
- 医生分享
- 多宝宝支持

## 用户流程

### 核心路径：记录一次喂奶

```
打开 App（收到提醒 or 主动打开）
  → 首页显示"上次喂奶 2小时前"
  → 点击"喂奶"按钮
  → 选择时间（默认现在）、奶量、奶源
  → 点击保存
  → 首页更新，数据同步到老公手机
  → 老公手机上看到"老婆记录了一次喂奶"
```

### 核心路径：记录体重

```
进入"体重"页面
  → 点击"添加记录"
  → 输入日期（默认今天）、体重
  → 保存
  → 体重记录列表更新，显示历史趋势
```

## UI/UX

### 页面结构

| 页面 | 路由 | 描述 |
|------|------|------|
| 登录/注册 | /login, /register | 邮箱 + 密码，极简 |
| 首页仪表盘 | / | 今日摘要 + 最近记录时间线 |
| 喂奶记录 | /feed | 喂奶表单 + 历史列表 |
| 吸奶记录 | /pump | 吸奶表单 + 历史列表 |
| 换尿布 | /diaper | 换尿布表单 + 历史列表 |
| 体重 | /weight | 体重记录列表 + 添加 |
| 设置 | /settings | 宝宝信息、提醒设置、登出 |

### 设计语言

- **风格**：温暖、柔和、简洁 —— 目标用户是新手妈妈，避免冷色调/科技感
- **配色**：
  - 主色：柔和粉色 `#F9D5D5`（温暖、柔和）
  - 强调色：薄荷绿 `#A8D8D8`（清新、舒缓）
  - 背景：米白 `#FFF9F5`
  - 文字：深灰 `#3A3A3A`
- **字体**：系统字体栈，优先苹方/思源黑体
- **参考**：BabyConnect、Notion 的卡片式布局
- **圆角**：大圆角（16px+），减少锐利感
- **图标**：圆润线条风格

### 移动端优先

- PWA，可添加到桌面
- 全屏沉浸式体验，无浏览器地址栏
- 大按钮易点击（最小 44px 触控区）
- 底部 Tab 导航，随时切换核心功能

## 技术方案

### 技术栈

| 层 | 选择 | 说明 |
|----|------|------|
| 前端框架 | React (Vite) | 熟悉，快速开发 |
| 样式 | Tailwind CSS | 开发效率高 |
| PWA | vite-plugin-pwa | 生成 Service Worker |
| 后端 | Node.js + Express | 轻量，TS |
| 数据库 | PostgreSQL | 已有经验 |
| ORM | Sequelize | 已有经验 |
| 部署 | 当前 sandbox 环境 | 先行开发，后续迁移 |
| 认证 | JWT + 邮箱密码 | 极简，无需第三方登录 |

### API 设计

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/auth/register` | POST | 注册（email + password） |
| `/api/auth/login` | POST | 登录，返回 JWT |
| `/api/baby` | GET/POST | 获取/创建宝宝档案 |
| `/api/records` | GET/POST | 获取记录列表 / 创建记录 |
| `/api/records/:id` | DELETE | 删除记录 |
| `/api/records/feed` | GET | 按类型筛选记录 |
| `/api/reminders` | GET/POST/PUT/DELETE | 提醒 CRUD |
| `/api/sync` | GET/POST | 全量同步接口 |

### 数据模型

```
User
  - id: UUID
  - email: string (unique)
  - password_hash: string
  - created_at: timestamp

Baby
  - id: UUID
  - name: string
  - birth_date: date
  - gender: enum(male/female)
  - created_at: timestamp

Record
  - id: UUID
  - baby_id: UUID (fk)
  - user_id: UUID (fk)  — 谁记录的
  - type: enum(feed/pump/diaper/weight)
  - data: jsonb  — 类型不同字段不同
    - feed: { amount, source: breast/formula, time }
    - pump: { amount, side: left/right/both, time }
    - diaper: { type: pee/poop/both }
    - weight: { weight_kg, date }
  - created_at: timestamp

Reminder
  - id: UUID
  - baby_id: UUID (fk)
  - user_id: UUID (fk)
  - type: enum(pump/diaper)
  - interval_minutes: int
  - enabled: boolean
  - last_triggered: timestamp
```

### 同步策略

- 每次打开 App 调用 `/api/sync`，获取上次同步后的所有新记录
- 提交记录时带上 `client_created_at`，服务端以服务端时间为准
- 冲突策略：后写优先（last-write-wins），暂不做复杂合并

## 里程碑

| 阶段 | 内容 | 目标日期 |
|------|------|----------|
| Phase 1 | 项目初始化、后端 CRUD、账号系统 | 4天 |
| Phase 2 | 前端核心页面（首页、喂奶、吸奶、尿布、体重） | 4天 |
| Phase 3 | PWA 配置、提醒功能、数据同步 | 3天 |
| Phase 4 | 部署上线、真机测试 | 2天 |

## 已知风险

1. **PWA 推送通知在华为浏览器上表现不稳定** — 华为浏览器对 Web Push 支持有限，提醒可能不准时。应对：先做基于前端的本地提醒，后续如有需要再考虑快应用。
2. **华为手机电池优化可能杀掉后台进程** — PWA 进程被杀后提醒收不到。应对：告知用户把 App 加入电池白名单。
3. **sandbox 环境不保证 24 小时在线** — 开发阶段没问题，生产部署需迁移到稳定服务器。
