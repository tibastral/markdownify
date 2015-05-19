(function ($) {
  $.fn.markdownify = function (options) {
    if (options && options['cloudinary']) {
      var cloudName = options['cloudinary']['cloudName'];
      var unsignedUploadingKey = options['cloudinary']['unsignedUploadingKey'];
    }

    this.each(function () {
      current_element = this;
      var editor = CodeMirror.fromTextArea(current_element, {
        mode: 'markdown',
        lineNumbers: true,
        lineWrapping: true,
        theme: "default",
        extraKeys: {"Enter": "newlineAndIndentContinueMarkdownList"}
      });
      editor.on('change', function () {
        $(current_element).html(editor.getValue())
      });

      // change the default preview button text to the data attribute if it exists
      var $previewButton = $('.btn--preview[data-target="' + current_element.id + '"]');

      // use sensible defaults if the user doesn't give us any
      var defaultPreviewToggleText = $previewButton.text() || 'Preview';
      var defaultEditToggleText = $previewButton.data('toggle-text') || 'Edit';

      // set the default text to what the user has given us (or the defaults)
      $previewButton.text(defaultPreviewToggleText);

      var insertions = {
        el : function(e) {
          editor.replaceSelection(e.data('prefix') + editor.getSelection());
          if (e.data('suffix'))
            editor.replaceSelection(e.data('suffix'), 'start');
        },
        link : function () {
          var link = window.prompt('Enter an url').trim();
          if (link !== null && link.length > 0) {
              var selection = editor.getSelection();
              selection = selection.length === 0 ? link : selection;
              editor.replaceSelection('[' + selection + '](' + link + ')')
          }
        },
        video : function () {
          var videoLink = window.prompt('Enter a video url ex: https://www.youtube.com/watch?v=bGutVrdL3M8');
          if (videoLink && videoLink.length > 0){
            editor.replaceSelection("\n" + $.trim(videoLink)+ "\n\n")
          }
        },
        img : function (e) {
          $("#" + e.parent('.markdownify-menu').data('target') + "-upload_field").trigger('click');
        }
      }

      $('.markdownify-menu[data-target="' + current_element.id + '"] .btn--insert').click(function (ev) {
        insertions[$(this).data('type') || 'el']($(this))
        editor.focus();
        ev.preventDefault();
      });

      $('.btn--preview[data-target="' + current_element.id + '"]').click(function (ev) {
        // Cache the selector
        var $this = $(this);

        $(editor.getWrapperElement()).toggleClass('markdownify--hidden');
        $('.' + $this.data('target') + '-preview').toggleClass('markdownify--hidden').html(marked(($('#' + $this.data('target'))).html()))

        // When the input text is the same as the default, we use the opposite text (clicked v default)
        var textToSwitchTo = defaultPreviewToggleText === $this.text() ? defaultEditToggleText : defaultPreviewToggleText;

        $this.text(textToSwitchTo);
      });

      $('.' + current_element.id + '-preview').toggleClass('markdownify--hidden')

      if (cloudName) {
        $('body').append("\
          <form enctype='multipart/form-data'>\
            <input class='upload_field' data-target='" + current_element.id + "' id='" + current_element.id + "-upload_field' name='file' type='file'/>\
          </form>\
        ")


        $('.upload_field[data-target=' + current_element.id + ']').unsigned_cloudinary_upload(unsignedUploadingKey,
          { cloud_name: cloudName, tags: 'browser_uploads' },
          { multiple: true }
        ).bind('cloudinarydone', function(e, data) {
          editor.replaceSelection('![](' + $.cloudinary.url(data.result.public_id, {cloud_name: cloudName}) + ")\n");
          editor.focus();
        });
      }
    })
    return this;
  }
})(jQuery);
