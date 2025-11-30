import { supabase } from './supabaseClient';
import { AssetData } from '../types';

export const saveAsset = async (asset: AssetData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('assets')
    .upsert({ 
      ...asset,
      user_id: user.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'Asset Tag' }) // Assuming Asset Tag is unique
    .select();

  if (error) throw error;
  return data;
};

export const saveAssets = async (assets: AssetData[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const assetsWithUser = assets.map(asset => ({
    ...asset,
    user_id: user.id,
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('assets')
    .upsert(assetsWithUser, { onConflict: 'Asset Tag' })
    .select();

  if (error) throw error;
  return data;
};

export const getAssets = async () => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data as AssetData[];
};

export const deleteAsset = async (assetTag: string) => {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('Asset Tag', assetTag);

  if (error) throw error;
};
