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
      })
      var insertions = {
        el : function(e) {
          editor.replaceSelection(e.data('prefix') + editor.getSelection());
          if (e.data('suffix'))
            editor.replaceSelection(e.data('suffix'), 'start');
        },
        link : function () {
          var link = window.prompt('Enter an url')
          editor.replaceSelection('[' + link + '](' + link + ')')
        },
        video : function () {
          editor.replaceSelection("\n" + window.prompt('Enter a video url ex: https://www.youtube.com/watch?v=bGutVrdL3M8') + "\n\n")
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
        $(editor.getWrapperElement()).toggleClass('markdownify--hidden');
        $('.' + $(this).data('target') + '-preview').toggleClass('markdownify--hidden').html(marked(($('#' + $(this).data('target'))).html()))
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
