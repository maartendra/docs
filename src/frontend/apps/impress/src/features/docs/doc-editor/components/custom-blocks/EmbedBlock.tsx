import {
  BlockConfig,
  BlockNoDefaults,
  BlockNoteEditor,
  InlineContentSchema,
  StyleSchema,
} from '@blocknote/core';
import { insertOrUpdateBlockForSlashMenu } from '@blocknote/core/extensions';
import * as locales from '@blocknote/core/locales';
import {
  AddFileButton,
  ResizableFileBlockWrapper,
  createReactBlockSpec,
} from '@blocknote/react';
import { TFunction } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createGlobalStyle } from 'styled-components';

import { Box, Icon } from '@/components';
import { isSafeUrl } from '@/utils/url';

import Warning from '../../assets/warning.svg';
import { DocsBlockNoteEditor } from '../../types';

const EmbedBlockStyle = createGlobalStyle`
  .bn-block-content[data-content-type="embed"] .bn-file-block-content-wrapper {
    width: fit-content;
  }
  .bn-block-content[data-content-type="embed"] .bn-file-block-content-wrapper[style*="fit-content"] {
    width: 100% !important;
  }
`;

type FileBlockEditor = Parameters<typeof AddFileButton>[0]['editor'];
type FileBlockBlock = Parameters<typeof AddFileButton>[0]['block'];

const isSameOriginUrl = (url: string): boolean => {
  try {
    return (
      new URL(url, window.location.origin).origin === window.location.origin
    );
  } catch {
    return true;
  }
};

type CreateEmbedBlockConfig = BlockConfig<
  'embed',
  {
    backgroundColor: { default: 'default' };
    caption: { default: '' };
    name: { default: '' };
    previewWidth: { default: undefined; type: 'number' };
    showPreview: { default: true };
    textAlignment: { default: 'left' };
    uploadDisabled: { default: true };
    url: { default: '' };
  },
  'none'
>;

interface EmbedBlockComponentProps {
  block: BlockNoDefaults<
    Record<'embed', CreateEmbedBlockConfig>,
    InlineContentSchema,
    StyleSchema
  >;
  editor: BlockNoteEditor<
    Record<'embed', CreateEmbedBlockConfig>,
    InlineContentSchema,
    StyleSchema
  >;
}

const EmbedBlockComponent = ({ editor, block }: EmbedBlockComponentProps) => {
  const embedUrl = block.props.url;
  const { i18n, t } = useTranslation();
  const lang = i18n.resolvedLanguage;

  useEffect(() => {
    if (lang && locales[lang as keyof typeof locales]) {
      locales[lang as keyof typeof locales].file_blocks.add_button_text[
        'embed'
      ] = t('Add embed');
      (
        locales[lang as keyof typeof locales].file_panel.embed
          .embed_button as Record<string, string>
      )['embed'] = t('Embed');
    }
  }, [lang, t]);

  const isInvalidEmbed =
    !!embedUrl && (!isSafeUrl(embedUrl) || isSameOriginUrl(embedUrl));

  if (isInvalidEmbed) {
    return (
      <Box
        $direction="row"
        $gap="0.5rem"
        $width="inherit"
        $css="pointer-events: none;"
        contentEditable={false}
        draggable={false}
      >
        <Warning />
        {t('Invalid or unsafe URL.')}
      </Box>
    );
  }

  return (
    <>
      <EmbedBlockStyle />
      <ResizableFileBlockWrapper
        buttonIcon={
          <Icon iconName="public" $size="24px" $css="line-height: normal;" />
        }
        block={block as unknown as FileBlockBlock}
        editor={editor as unknown as FileBlockEditor}
      >
        {!!embedUrl && (
          <Box
            as="iframe"
            className="bn-visual-media"
            role="presentation"
            $width="100%"
            $height="450px"
            src={embedUrl}
            title={block.props.name || t('Embedded content')}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
            referrerPolicy="no-referrer"
            loading="lazy"
            contentEditable={false}
            draggable={false}
          />
        )}
      </ResizableFileBlockWrapper>
    </>
  );
};

export const EmbedBlock = createReactBlockSpec(
  {
    type: 'embed',
    content: 'none',
    propSchema: {
      backgroundColor: { default: 'default' as const },
      caption: { default: '' as const },
      name: { default: '' as const },
      previewWidth: { default: undefined, type: 'number' },
      showPreview: { default: true },
      textAlignment: { default: 'left' as const },
      uploadDisabled: { default: true },
      url: { default: '' as const },
    },
  },
  {
    meta: {
      fileBlockAccept: [],
    },
    render: (props) => <EmbedBlockComponent {...props} />,
  },
);

export const getEmbedReactSlashMenuItems = (
  editor: DocsBlockNoteEditor,
  t: TFunction<'translation', undefined>,
  group: string,
) => [
  {
    title: t('Embed'),
    onItemClick: () => {
      insertOrUpdateBlockForSlashMenu(editor, { type: 'embed' });
    },
    aliases: [t('embed'), t('iframe'), t('website'), t('link')],
    group,
    icon: <Icon iconName="public" $size="18px" />,
    subtext: t('Embed a web page'),
  },
];
