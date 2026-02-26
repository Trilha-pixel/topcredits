-- Função para comprar tokens debitando do saldo do revendedor
-- Cada token custa R$ 5,00

CREATE OR REPLACE FUNCTION purchase_tokens(
  p_user_id UUID,
  p_tokens_amount INTEGER,
  p_total_cost DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL;
  v_current_tokens INTEGER;
BEGIN
  -- Verificar saldo atual
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE user_id = p_user_id;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Carteira não encontrada';
  END IF;

  IF v_current_balance < p_total_cost THEN
    RAISE EXCEPTION 'Saldo insuficiente. Necessário: R$ %, Disponível: R$ %', p_total_cost, v_current_balance;
  END IF;

  -- Obter tokens atuais (se existir registro)
  SELECT token_balance INTO v_current_tokens
  FROM licenses_tokens
  WHERE user_id = p_user_id;

  -- Debitar do saldo
  UPDATE wallets
  SET balance = balance - p_total_cost,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Adicionar tokens (criar registro se não existir)
  IF v_current_tokens IS NULL THEN
    INSERT INTO licenses_tokens (user_id, token_balance)
    VALUES (p_user_id, p_tokens_amount);
  ELSE
    UPDATE licenses_tokens
    SET token_balance = token_balance + p_tokens_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Registrar transação
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (
    p_user_id,
    'purchase',
    -p_total_cost,
    FORMAT('Compra de %s tokens para licenças Lovable', p_tokens_amount)
  );

END;
$$;

-- Criar tabela para armazenar saldo de tokens (se não existir)
CREATE TABLE IF NOT EXISTS licenses_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS para licenses_tokens
ALTER TABLE licenses_tokens ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios tokens
CREATE POLICY "Users can view own tokens"
  ON licenses_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas a função pode modificar tokens
CREATE POLICY "Only function can modify tokens"
  ON licenses_tokens
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Admins podem ver todos os tokens
CREATE POLICY "Admins can view all tokens"
  ON licenses_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
