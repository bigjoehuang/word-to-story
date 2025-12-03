import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少必要的环境变量')
  console.error('请确保 .env.local 文件中包含:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testDatabase() {
  console.log('🚀 开始测试数据库连接...\n')

  try {
    // Test 1: Check connection
    console.log('1️⃣ 测试数据库连接...')
    const { data, error } = await supabase.from('stories').select('count').limit(1)
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      throw error
    }
    
    console.log('✅ 数据库连接成功\n')

    // Test 2: Read and execute SQL schema
    console.log('2️⃣ 读取 SQL 脚本...')
    const sqlPath = join(process.cwd(), 'supabase', 'schema.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    console.log('✅ SQL 脚本读取成功\n')

    // Test 3: Execute SQL (Supabase doesn't support direct SQL execution via JS client)
    // We'll need to use the REST API or provide instructions
    console.log('3️⃣ 创建表结构...')
    console.log('⚠️  注意: Supabase JS 客户端不支持直接执行 DDL SQL')
    console.log('   请按照以下步骤在 Supabase Dashboard 中执行 SQL:\n')
    console.log('   1. 访问 Supabase Dashboard')
    console.log('   2. 进入 SQL Editor')
    console.log('   3. 复制以下 SQL 并执行:\n')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))
    console.log()

    // Test 4: Check if table exists (after user creates it)
    console.log('4️⃣ 检查表是否存在...')
    const { data: stories, error: selectError } = await supabase
      .from('stories')
      .select('*')
      .limit(1)

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        console.log('❌ 表不存在，请先执行上面的 SQL 创建表\n')
      } else {
        throw selectError
      }
    } else {
      console.log('✅ 表已存在\n')
    }

    // Test 5: Test insert (if table exists)
    if (!selectError) {
      console.log('5️⃣ 测试插入数据...')
      const testStory = {
        words: '测试',
        content: '这是一个测试故事，用于验证数据库功能是否正常。',
        likes: 0
      }

      const { data: inserted, error: insertError } = await supabase
        .from('stories')
        .insert(testStory)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      console.log('✅ 数据插入成功')
      console.log('   插入的数据:', inserted)
      console.log()

      // Test 6: Test query
      console.log('6️⃣ 测试查询数据...')
      const { data: queried, error: queryError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', inserted.id)
        .single()

      if (queryError) {
        throw queryError
      }

      console.log('✅ 数据查询成功')
      console.log('   查询的数据:', queried)
      console.log()

      // Test 7: Clean up test data
      console.log('7️⃣ 清理测试数据...')
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', inserted.id)

      if (deleteError) {
        console.log('⚠️  清理测试数据失败:', deleteError.message)
      } else {
        console.log('✅ 测试数据已清理\n')
      }
    }

    console.log('🎉 数据库测试完成！')

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message)
    if (error.details) {
      console.error('   详情:', error.details)
    }
    if (error.hint) {
      console.error('   提示:', error.hint)
    }
    process.exit(1)
  }
}

testDatabase()


