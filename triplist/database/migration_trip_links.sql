-- trip_linksテーブルに新しいカラムを追加（既存テーブルがある場合）

-- user_idカラムが存在しない場合のみ追加
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'trip_links' AND column_name = 'user_id') THEN
        ALTER TABLE trip_links ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- created_atカラムが存在しない場合のみ追加
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'trip_links' AND column_name = 'created_at') THEN
        ALTER TABLE trip_links ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- idカラムをUUIDに変更（必要に応じて）
-- 注意: 既存データがある場合は慎重に実行
-- DO $$ 
-- BEGIN
--     IF EXISTS (SELECT 1 FROM information_schema.columns 
--               WHERE table_name = 'trip_links' AND column_name = 'link_id') THEN
--         ALTER TABLE trip_links RENAME COLUMN link_id TO id;
--         ALTER TABLE trip_links ALTER COLUMN id TYPE UUID USING gen_random_uuid();
--         ALTER TABLE trip_links ALTER COLUMN id SET DEFAULT gen_random_uuid();
--     END IF;
-- END $$;

-- 一意制約を追加（既存しない場合のみ）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                  WHERE conname = 'trip_links_group_trip_id_user_id_key') THEN
        ALTER TABLE trip_links ADD CONSTRAINT trip_links_group_trip_id_user_id_key 
        UNIQUE(group_trip_id, user_id);
    END IF;
END $$;

-- インデックスの作成（既存しない場合のみ）
CREATE INDEX IF NOT EXISTS idx_trip_links_group_trip_id ON trip_links(group_trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_links_personal_trip_id ON trip_links(personal_trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_links_user_id ON trip_links(user_id);

-- RLS（Row Level Security）の設定
ALTER TABLE trip_links ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除してから新しいポリシーを作成
DROP POLICY IF EXISTS "Users can view their own trip links" ON trip_links;
DROP POLICY IF EXISTS "Users can insert their own trip links" ON trip_links;
DROP POLICY IF EXISTS "Users can delete their own trip links" ON trip_links;

-- ユーザーは自分のリンクのみアクセス可能
CREATE POLICY "Users can view their own trip links" ON trip_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trip links" ON trip_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip links" ON trip_links
  FOR DELETE USING (auth.uid() = user_id);
