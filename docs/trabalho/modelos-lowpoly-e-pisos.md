# Modelos low-poly e pisos diferenciados

## Fatos

- O pedido do usuário é visual: criar no Blender modelos originais para terreno sem construções, 1, 2 e 3 casas e hotel; colorir elementos pela cor do dono; substituir a faixa de grupo por piso residencial inteiro colorido; distinguir pisos de canto e casas especiais.
- A sessão conectada foi Blender 5.2.2 LTS. O add-on MCP respondeu com protocolo 14 quando o servidor espera 15, mas execução de bpy, inspeção e exportação GLB funcionaram.
- A primeira prévia saiu deitada porque a geometria usou Y como altura em Blender, que usa Z-up. A versão refeita usa Z-up no arquivo Blender e export_yup=True na exportação para o Three.js. A prévia corrigida foi inspecionada no Blender.
- A primeira tentativa de validar no navegador falhou porque Vite e Colyseus foram iniciados sob o sandbox sem acesso de loopback; mensagens “ready/listening” não garantiram acesso browser. Uma tentativa duplicada encontrou a porta 2567 ocupada. A tentativa via janela Chrome existente também não pôde prosseguir porque a URL atual não estava clara.
- Correção aplicada: iniciar uma única instância de cada servidor com permissão local, abrir uma aba IAB nova numa URL explícita de localhost e usar os índices AX atuais após cada ação.
- Um erro de automação de texto veio de chamar typeText(text); a API da aba exige typeText(index, text). A tentativa foi refeita após ler o estado atual e confirmar o campo focado.

## Decisões confirmadas pelo usuário

- Toda a superfície dos imóveis residenciais recebe a cor do grupo; estações e casas especiais têm paletas próprias.
- Partes coloridas dos modelos devem seguir a cor do dono.
- O trabalho usa Blender do PC, na versão mais recente instalada.
- O fluxo Blender e o fluxo de playtest local foram acrescentados às regras em AGENTS.md.

## Implementação

- Fonte Blender: assets/blender/board-models.blend.
- GLB de cinco variantes: public/assets/board-models/board-models.glb.
- Integração visual e temas de piso: src/ui/BoardScene.tsx.
- Materiais de dono usam o nome estável OWNER_TINT; raízes GLB: Board_Land, Board_House_1, Board_House_2, Board_House_3, Board_Hotel.
- Nomes e contraste de texto seguem legíveis nos pisos coloridos. Desenhos geométricos discretos identificam taxas, sorte, prisão e cantos.

## Validação e publicação

1. No navegador interno, partida Clássica com três bots: comprei Jardins do Norte; saldo caiu a R$ 1.220.000. Os pisos por região foram revisados em 877 × 877. A cena em viewport móvel, Firefox e estados com casas/hotel construídos continua sem revisão visual.
2. npm run verify passou: 119 testes em 20 arquivos, build de cliente e servidor; os temas de piso têm três testes unitários.
3. Falhas e correções estão anotadas acima e em AGENTS.md: Blender Z-up/GLB Y-up, iniciar servidores com loopback, evitar instâncias duplicadas e seguir índices atuais da API CUA.
4. Próximo passo: buscar atualizações de origin, revisar o diff, commitar em main passando pelo hook e confirmar git push origin main.
