/**
 * 角色字典数据
 * 包含武侠小说、当代影视、历史人物、古典文学、动漫角色、童话角色、世界大佬、个性鲜明、文化名人中的经典角色
 */

export interface Character {
  id: string
  name: string
  category: 'wuxia' | 'modern' | 'history' | 'classic' | 'anime' | 'fairy-tale' | 'world-leaders' | 'unique-personalities' | 'cultural-icons'
  description?: string
}

// 武侠小说角色
const WUXIA_CHARACTERS: Character[] = [
  { id: 'linghuchong', name: '令狐冲', category: 'wuxia', description: '笑傲江湖，洒脱不羁' },
  { id: 'guojing', name: '郭靖', category: 'wuxia', description: '射雕英雄，侠之大者' },
  { id: 'huangrong', name: '黄蓉', category: 'wuxia', description: '聪明机敏，古灵精怪' },
  { id: 'yangguo', name: '杨过', category: 'wuxia', description: '神雕大侠，情深义重' },
  { id: 'xiaolongnv', name: '小龙女', category: 'wuxia', description: '冰清玉洁，不食人间烟火' },
  { id: 'zhangwuji', name: '张无忌', category: 'wuxia', description: '明教教主，仁厚善良' },
  { id: 'zhaomin', name: '赵敏', category: 'wuxia', description: '蒙古郡主，智勇双全' },
  { id: 'zhouzhiruo', name: '周芷若', category: 'wuxia', description: '峨眉掌门，外柔内刚' },
  { id: 'weixiaobao', name: '韦小宝', category: 'wuxia', description: '鹿鼎公，机智圆滑' },
  { id: 'duanyu', name: '段誉', category: 'wuxia', description: '大理世子，温文尔雅' },
  { id: 'qiaofeng', name: '乔峰', category: 'wuxia', description: '丐帮帮主，豪气干云' },
  { id: 'xuzhu', name: '虚竹', category: 'wuxia', description: '灵鹫宫主，憨厚善良' },
  { id: 'dongfangbubai', name: '东方不败', category: 'wuxia', description: '日月神教教主，武功盖世' },
  { id: 'renyingying', name: '任盈盈', category: 'wuxia', description: '日月神教圣姑，聪慧美丽' },
  { id: 'yideng', name: '一灯大师', category: 'wuxia', description: '南帝，慈悲为怀' },
]

// 当代影视角色
const MODERN_CHARACTERS: Character[] = [
  { id: 'sunwukong', name: '孙悟空', category: 'modern', description: '齐天大圣，神通广大' },
  { id: 'nezha', name: '哪吒', category: 'modern', description: '三太子，我命由我不由天' },
  { id: 'baiqian', name: '白浅', category: 'modern', description: '青丘女君，四海八荒第一绝色' },
  { id: 'yehua', name: '夜华', category: 'modern', description: '天族太子，深情专一' },
  { id: 'weiwuxian', name: '魏无羡', category: 'modern', description: '夷陵老祖，潇洒不羁' },
  { id: 'lanwangji', name: '蓝忘机', category: 'modern', description: '含光君，雅正端方' },
  { id: 'xiaoqian', name: '小倩', category: 'modern', description: '倩女幽魂，美丽善良' },
  { id: 'ningcai', name: '宁采臣', category: 'modern', description: '书生，正直善良' },
  { id: 'liuxiang', name: '李逍遥', category: 'modern', description: '仙剑奇侠，仗剑江湖' },
  { id: 'zhaolinger', name: '赵灵儿', category: 'modern', description: '女娲后人，温柔善良' },
  { id: 'xuerjian', name: '雪见', category: 'modern', description: '唐家大小姐，活泼可爱' },
  { id: 'longyang', name: '龙阳', category: 'modern', description: '姜国太子，重情重义' },
  { id: 'xuanji', name: '璇玑', category: 'modern', description: '战神转世，纯真善良' },
  { id: 'sifeng', name: '司凤', category: 'modern', description: '金翅鸟妖，深情专一' },
  { id: 'huaxu', name: '花千骨', category: 'modern', description: '长留弟子，坚韧不拔' },
]

// 历史人物角色
const HISTORY_CHARACTERS: Character[] = [
  { id: 'zhugeliang', name: '诸葛亮', category: 'history', description: '卧龙先生，智谋超群' },
  { id: 'libai', name: '李白', category: 'history', description: '诗仙，豪放不羁' },
  { id: 'sushi', name: '苏轼', category: 'history', description: '东坡居士，文豪词圣' },
  { id: 'yuefei', name: '岳飞', category: 'history', description: '精忠报国，民族英雄' },
  { id: 'huamulan', name: '花木兰', category: 'history', description: '代父从军，巾帼英雄' },
  { id: 'xiangyu', name: '项羽', category: 'history', description: '西楚霸王，力拔山兮' },
  { id: 'liubang', name: '刘邦', category: 'history', description: '汉高祖，知人善任' },
  { id: 'wuzetian', name: '武则天', category: 'history', description: '一代女皇，雄才大略' },
  { id: 'qinshihuang', name: '秦始皇', category: 'history', description: '千古一帝，统一六国' },
  { id: 'caocao', name: '曹操', category: 'history', description: '乱世奸雄，文韬武略' },
  { id: 'zhangfei', name: '张飞', category: 'history', description: '万人敌，勇猛刚烈' },
  { id: 'guanyu', name: '关羽', category: 'history', description: '武圣，忠义无双' },
  { id: 'zhaoyun', name: '赵云', category: 'history', description: '常山赵子龙，一身是胆' },
  { id: 'sunquan', name: '孙权', category: 'history', description: '吴大帝，守成之主' },
]

// 古典文学角色
const CLASSIC_CHARACTERS: Character[] = [
  { id: 'jiabaoyu', name: '贾宝玉', category: 'classic', description: '红楼梦主角，情痴情种' },
  { id: 'lindaiyu', name: '林黛玉', category: 'classic', description: '潇湘妃子，才情绝代' },
  { id: 'xuebaochai', name: '薛宝钗', category: 'classic', description: '蘅芜君，端庄贤淑' },
  { id: 'luzhishen', name: '鲁智深', category: 'classic', description: '花和尚，行侠仗义' },
  { id: 'wusong', name: '武松', category: 'classic', description: '打虎英雄，刚正不阿' },
  { id: 'songjiang', name: '宋江', category: 'classic', description: '及时雨，梁山首领' },
  { id: 'sunwukong-classic', name: '孙悟空', category: 'classic', description: '齐天大圣，斗战胜佛' },
  { id: 'zhubajie', name: '猪八戒', category: 'classic', description: '天蓬元帅，憨厚可爱' },
  { id: 'shaseng', name: '沙僧', category: 'classic', description: '卷帘大将，忠厚老实' },
  { id: 'tangsen', name: '唐僧', category: 'classic', description: '金蝉子，慈悲为怀' },
  { id: 'linchong', name: '林冲', category: 'classic', description: '豹子头，八十万禁军教头' },
  { id: 'ligui', name: '李逵', category: 'classic', description: '黑旋风，直率鲁莽' },
  { id: 'wuyong', name: '吴用', category: 'classic', description: '智多星，足智多谋' },
  { id: 'gongsunsheng', name: '公孙胜', category: 'classic', description: '入云龙，道法高深' },
  { id: 'shijin', name: '史进', category: 'classic', description: '九纹龙，少年英雄' },
]

// 动漫角色
const ANIME_CHARACTERS: Character[] = [
  { id: 'lufei', name: '路飞', category: 'anime', description: '草帽小子，橡胶果实能力者' },
  { id: 'mingren', name: '鸣人', category: 'anime', description: '木叶忍者，九尾人柱力' },
  { id: 'kenan', name: '柯南', category: 'anime', description: '名侦探，真相只有一个' },
  { id: 'qianxun', name: '千寻', category: 'anime', description: '勇敢少女，寻找自我' },
  { id: 'wukong-anime', name: '悟空', category: 'anime', description: '超级赛亚人，保护地球' },
  { id: 'beijita', name: '贝吉塔', category: 'anime', description: '赛亚人王子，高傲强大' },
  { id: 'yihu', name: '一护', category: 'anime', description: '死神代理，守护伙伴' },
  { id: 'tanzhilang', name: '炭治郎', category: 'anime', description: '鬼杀队剑士，温柔坚强' },
  { id: 'zhuzhu', name: '祢豆子', category: 'anime', description: '鬼之少女，纯真善良' },
  { id: 'sasuke', name: '佐助', category: 'anime', description: '宇智波天才，复仇者' },
  { id: 'sakura', name: '小樱', category: 'anime', description: '医疗忍者，坚强独立' },
  { id: 'naruto', name: '漩涡鸣人', category: 'anime', description: '火影忍者，永不放弃' },
  { id: 'luffy', name: '蒙奇·D·路飞', category: 'anime', description: '要成为海贼王的男人' },
  { id: 'zoro', name: '索隆', category: 'anime', description: '三刀流剑士，世界第一剑豪' },
  { id: 'sanji', name: '山治', category: 'anime', description: '黑足，厨师兼战斗员' },
]

// 童话角色
const FAIRY_TALE_CHARACTERS: Character[] = [
  { id: 'snow-white', name: '白雪公主', category: 'fairy-tale', description: '善良美丽的公主' },
  { id: 'cinderella', name: '灰姑娘', category: 'fairy-tale', description: '善良勇敢的少女' },
  { id: 'little-red-riding-hood', name: '小红帽', category: 'fairy-tale', description: '天真可爱的小女孩' },
  { id: 'little-mermaid', name: '小美人鱼', category: 'fairy-tale', description: '为爱牺牲的人鱼公主' },
  { id: 'alice', name: '爱丽丝', category: 'fairy-tale', description: '好奇勇敢的少女' },
  { id: 'sleeping-beauty', name: '睡美人', category: 'fairy-tale', description: '被诅咒的公主' },
  { id: 'beauty', name: '贝儿', category: 'fairy-tale', description: '美女与野兽中的女主角' },
  { id: 'rapunzel', name: '长发公主', category: 'fairy-tale', description: '拥有魔法长发的公主' },
  { id: 'mulan-fairy', name: '花木兰', category: 'fairy-tale', description: '迪士尼版花木兰' },
  { id: 'moana', name: '莫阿娜', category: 'fairy-tale', description: '勇敢的海洋公主' },
  { id: 'elsa', name: '艾莎', category: 'fairy-tale', description: '冰雪女王，拥有魔法' },
  { id: 'anna', name: '安娜', category: 'fairy-tale', description: '勇敢乐观的公主' },
  { id: 'ariel', name: '爱丽儿', category: 'fairy-tale', description: '小美人鱼，向往人类世界' },
  { id: 'belle', name: '贝儿', category: 'fairy-tale', description: '热爱阅读的美丽女孩' },
  { id: 'jasmine', name: '茉莉', category: 'fairy-tale', description: '独立自主的公主' },
]

// 世界大佬角色
const WORLD_LEADERS_CHARACTERS: Character[] = [
  { id: 'huangrenxun', name: '黄仁勋', category: 'world-leaders', description: 'NVIDIA CEO，AI芯片之王' },
  { id: 'masike', name: '马斯克', category: 'world-leaders', description: '特斯拉、SpaceX CEO，科技狂人' },
  { id: 'telangpu', name: '特朗普', category: 'world-leaders', description: '美国前总统，商业大亨' },
  { id: 'biergaici', name: '比尔·盖茨', category: 'world-leaders', description: '微软创始人，慈善家' },
  { id: 'shamuaoteman', name: '山姆·奥特曼', category: 'world-leaders', description: 'OpenAI CEO，AI革命推动者' },
  { id: 'zhakeboge', name: '扎克伯格', category: 'world-leaders', description: 'Meta CEO，社交网络创始人' },
  { id: 'beifusi', name: '贝索斯', category: 'world-leaders', description: '亚马逊创始人，电商巨头' },
  { id: 'kufei', name: '库克', category: 'world-leaders', description: '苹果CEO，科技界领袖' },
  { id: 'lalai', name: '拉里·佩奇', category: 'world-leaders', description: 'Google联合创始人' },
  { id: 'xieerge', name: '谢尔盖·布林', category: 'world-leaders', description: 'Google联合创始人' },
  { id: 'maoyun', name: '马云', category: 'world-leaders', description: '阿里巴巴创始人，电商教父' },
  { id: 'mahuateng', name: '马化腾', category: 'world-leaders', description: '腾讯创始人，社交帝国缔造者' },
  { id: 'renzhengfei', name: '任正非', category: 'world-leaders', description: '华为创始人，通信巨头' },
  { id: 'leijun', name: '雷军', category: 'world-leaders', description: '小米创始人，手机行业颠覆者' },
  { id: 'wangxing', name: '王兴', category: 'world-leaders', description: '美团创始人，本地生活服务之王' },
]

// 个性鲜明的人物
const UNIQUE_PERSONALITIES_CHARACTERS: Character[] = [
  { id: 'fangaogao', name: '梵高', category: 'unique-personalities', description: '后印象派画家，用生命燃烧艺术' },
  { id: 'dafengi', name: '达芬奇', category: 'unique-personalities', description: '文艺复兴全才，艺术与科学完美结合' },
  { id: 'aoyinsitan', name: '爱因斯坦', category: 'unique-personalities', description: '物理天才，相对论之父' },
  { id: 'qiaobusi', name: '乔布斯', category: 'unique-personalities', description: '苹果创始人，完美主义偏执狂' },
  { id: 'nicai', name: '尼采', category: 'unique-personalities', description: '哲学家，超人理论的提出者' },
  { id: 'haimingwei', name: '海明威', category: 'unique-personalities', description: '硬汉作家，用简洁文字震撼世界' },
  { id: 'bijiasuo', name: '毕加索', category: 'unique-personalities', description: '立体主义大师，艺术革命者' },
  { id: 'zhuobielin', name: '卓别林', category: 'unique-personalities', description: '喜剧大师，用幽默讽刺社会' },
  { id: 'menglu', name: '玛丽莲·梦露', category: 'unique-personalities', description: '性感女神，美丽与悲剧并存' },
  { id: 'wodeer', name: '安迪·沃霍尔', category: 'unique-personalities', description: '波普艺术教父，消费文化的预言者' },
  { id: 'dali', name: '达利', category: 'unique-personalities', description: '超现实主义画家，梦境与现实的融合' },
  { id: 'wangxiaoer', name: '王尔德', category: 'unique-personalities', description: '唯美主义作家，才华横溢的叛逆者' },
  { id: 'sanmao', name: '三毛', category: 'unique-personalities', description: '流浪作家，自由不羁的灵魂' },
  { id: 'wangxiaobo', name: '王小波', category: 'unique-personalities', description: '特立独行的作家，黑色幽默大师' },
  { id: 'luyun', name: '鲁迅', category: 'unique-personalities', description: '文学巨匠，用笔杆子唤醒民族' },
]

// 文化名人（中国传统文化代表性人物）
const CULTURAL_ICONS_CHARACTERS: Character[] = [
  { id: 'kongzi', name: '孔子', category: 'cultural-icons', description: '至圣先师，儒家思想创始人' },
  { id: 'laozi', name: '老子', category: 'cultural-icons', description: '道家始祖，道德经作者' },
  { id: 'zhuangzi', name: '庄子', category: 'cultural-icons', description: '道家代表人物，逍遥游的哲人' },
  { id: 'mengzi', name: '孟子', category: 'cultural-icons', description: '亚圣，性善论提出者' },
  { id: 'xunzi', name: '荀子', category: 'cultural-icons', description: '儒家集大成者，性恶论提出者' },
  { id: 'mozi', name: '墨子', category: 'cultural-icons', description: '墨家创始人，兼爱非攻' },
  { id: 'hanfeizi', name: '韩非子', category: 'cultural-icons', description: '法家集大成者，法治思想' },
  { id: 'wangxizhi', name: '王羲之', category: 'cultural-icons', description: '书圣，兰亭集序作者' },
  { id: 'libai-culture', name: '李白', category: 'cultural-icons', description: '诗仙，浪漫主义诗人' },
  { id: 'dufu', name: '杜甫', category: 'cultural-icons', description: '诗圣，现实主义诗人' },
  { id: 'sushi-culture', name: '苏轼', category: 'cultural-icons', description: '东坡居士，文豪词圣' },
  { id: 'wangyangming', name: '王阳明', category: 'cultural-icons', description: '心学大师，知行合一' },
  { id: 'zhuxi', name: '朱熹', category: 'cultural-icons', description: '理学集大成者，格物致知' },
  { id: 'liangqichao', name: '梁启超', category: 'cultural-icons', description: '维新派领袖，思想启蒙者' },
  { id: 'luyun-culture', name: '鲁迅', category: 'cultural-icons', description: '新文化运动旗手，文学革命家' },
]

// 所有角色
export const ALL_CHARACTERS: Character[] = [
  ...WUXIA_CHARACTERS,
  ...MODERN_CHARACTERS,
  ...HISTORY_CHARACTERS,
  ...CLASSIC_CHARACTERS,
  ...ANIME_CHARACTERS,
  ...FAIRY_TALE_CHARACTERS,
  ...WORLD_LEADERS_CHARACTERS,
  ...UNIQUE_PERSONALITIES_CHARACTERS,
  ...CULTURAL_ICONS_CHARACTERS,
]

/**
 * 根据分类获取角色列表
 */
export function getCharactersByCategory(
  category: 'wuxia' | 'modern' | 'history' | 'classic' | 'anime' | 'fairy-tale' | 'world-leaders' | 'unique-personalities' | 'cultural-icons'
): Character[] {
  return ALL_CHARACTERS.filter(char => char.category === category)
}

/**
 * 根据ID获取角色
 */
export function getCharacterById(id: string): Character | undefined {
  return ALL_CHARACTERS.find(char => char.id === id)
}

/**
 * 根据名称搜索角色（支持模糊匹配）
 */
export function searchCharacters(query: string): Character[] {
  if (!query.trim()) {
    return ALL_CHARACTERS
  }
  const lowerQuery = query.toLowerCase()
  return ALL_CHARACTERS.filter(
    char =>
      char.name.includes(query) ||
      char.id.toLowerCase().includes(lowerQuery) ||
      (char.description && char.description.includes(query))
  )
}

/**
 * 获取所有分类
 */
export function getCategories(): Array<{ 
  id: 'wuxia' | 'modern' | 'history' | 'classic' | 'anime' | 'fairy-tale' | 'world-leaders' | 'unique-personalities' | 'cultural-icons'; 
  name: string 
}> {
  return [
    { id: 'wuxia', name: '武侠小说' },
    { id: 'modern', name: '当代影视' },
    { id: 'history', name: '历史人物' },
    { id: 'classic', name: '古典文学' },
    { id: 'anime', name: '动漫角色' },
    { id: 'fairy-tale', name: '童话角色' },
    { id: 'world-leaders', name: '世界大佬' },
    { id: 'unique-personalities', name: '个性鲜明' },
    { id: 'cultural-icons', name: '文化名人' },
  ]
}

