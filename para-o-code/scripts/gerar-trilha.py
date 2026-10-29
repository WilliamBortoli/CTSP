# Gera uma trilha de fundo com MusicGen (local, gratuito) para os vídeos de revisão.
# Uso: python para-o-code/scripts/gerar-trilha.py <saida.wav> [segundos]
import sys
import numpy as np
import soundfile as sf
import torch
from transformers import AutoProcessor, MusicgenForConditionalGeneration

saida = sys.argv[1]
seg = float(sys.argv[2]) if len(sys.argv) > 2 else 28
prompt = "calm focused study background music, soft electronic pads, light steady beat, warm piano, no vocals, minimal, 95 bpm"

proc = AutoProcessor.from_pretrained("facebook/musicgen-small")
modelo = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
torch.manual_seed(7)
ent = proc(text=[prompt], padding=True, return_tensors="pt")
audio = modelo.generate(**ent, do_sample=True, max_new_tokens=int(seg * 50))[0, 0].numpy()
sr = modelo.config.audio_encoder.sampling_rate
assert audio.size > sr * 5 and np.abs(audio).max() > 0.01, "trilha vazia"
sf.write(saida, audio / max(1e-6, np.abs(audio).max()) * 0.9, sr)
print(f"{saida}: {audio.size / sr:.1f} s")
